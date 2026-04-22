import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/students/[id]/schedule - Get student's current schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    // Get student's current schedule
    const schedule = await prisma.studentSchedule.findMany({
      where: {
        studentId: studentId,
        isActive: true
      },
      include: {
        course: {
          include: {
            semester: {
              include: {
                program: true
              }
            },
            faculty: true
          }
        },
        timeSlot: true,
        room: true,
        semester: true
      },
      orderBy: [
        { day: 'asc' },
        { timeSlot: { start: 'asc' } }
      ]
    })

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        semester: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Group schedule by day
    const scheduleByDay = schedule.reduce((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = []
      }
      acc[item.day].push(item)
      return acc
    }, {} as Record<string, typeof schedule>)

    // Calculate schedule statistics
    const stats = {
      totalCourses: schedule.length,
      totalHours: schedule.length, // Assuming each slot is 1 hour
      daysWithClasses: Object.keys(scheduleByDay).length,
      conflicts: schedule.filter(s => s.isConflict).length,
      crossSemesterCourses: schedule.filter(s => s.semesterId !== student.semesterId).length
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          regId: student.regId,
          regName: student.regName,
          program: student.program,
          semester: student.semester
        },
        schedule: scheduleByDay,
        scheduleList: schedule,
        statistics: stats
      }
    })

  } catch (error) {
    console.error('Error fetching student schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student schedule' },
      { status: 500 }
    )
  }
}

// POST /api/students/[id]/schedule - Update student's schedule (regenerate from enrollments)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    // Get student's active enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        isActive: true
      },
      include: {
        course: {
          include: {
            timetable: {
              include: {
                timeSlot: true,
                room: true
              }
            },
            semester: true
          }
        }
      }
    })

    // Clear existing schedule
    await prisma.studentSchedule.deleteMany({
      where: { studentId: studentId }
    })

    // Create new schedule entries from timetable
    const scheduleEntries = []
    for (const enrollment of enrollments) {
      for (const timetableEntry of enrollment.course.timetable) {
        scheduleEntries.push({
          studentId: studentId,
          courseId: enrollment.courseId,
          day: timetableEntry.day,
          timeSlotId: timetableEntry.timeSlotId,
          roomId: timetableEntry.roomId,
          semesterId: enrollment.course.semesterId,
          isActive: true
        })
      }
    }

    // Create schedule entries
    if (scheduleEntries.length > 0) {
      await prisma.studentSchedule.createMany({
        data: scheduleEntries
      })
    }

    // Detect and flag conflicts
    await detectAndFlagScheduleConflicts(studentId)

    return NextResponse.json({
      success: true,
      message: `Schedule updated with ${scheduleEntries.length} entries`,
      data: { entriesCreated: scheduleEntries.length }
    })

  } catch (error) {
    console.error('Error updating student schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update student schedule' },
      { status: 500 }
    )
  }
}

// Helper function to detect and flag schedule conflicts
async function detectAndFlagScheduleConflicts(studentId: number) {
  try {
    // Get all schedule entries for the student
    const scheduleEntries = await prisma.studentSchedule.findMany({
      where: {
        studentId: studentId,
        isActive: true
      },
      include: {
        course: true,
        timeSlot: true,
        room: true
      }
    })

    // Group by day and time slot to find conflicts
    const timeSlotGroups = scheduleEntries.reduce((acc, entry) => {
      const key = `${entry.day}-${entry.timeSlotId}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(entry)
      return acc
    }, {} as Record<string, typeof scheduleEntries>)

    // Find conflicts (multiple courses at same time)
    const conflicts = []
    for (const [timeSlotKey, entries] of Object.entries(timeSlotGroups)) {
      if (entries.length > 1) {
        // Mark all entries in this time slot as conflicts
        for (const entry of entries) {
          await prisma.studentSchedule.update({
            where: { id: entry.id },
            data: {
              isConflict: true,
              conflictReason: `Schedule conflict: ${entries.length} courses at ${entry.day} ${entry.timeSlot.start}-${entry.timeSlot.end}`
            }
          })
        }

        // Create conflict record
        conflicts.push({
          studentId: studentId,
          conflictType: 'SCHEDULING_CONFLICT',
          severity: 'HIGH',
          title: `Time Slot Conflict on ${entries[0].day}`,
          description: `Student has ${entries.length} courses scheduled at the same time: ${entries[0].day} ${entries[0].timeSlot.start}-${entries[0].timeSlot.end}`,
          affectedCourses: entries.map(e => ({
            id: e.courseId,
            name: e.course.name,
            code: e.course.code
          })),
          timeSlotInfo: {
            day: entries[0].day,
            timeSlot: {
              id: entries[0].timeSlotId,
              start: entries[0].timeSlot.start,
              end: entries[0].timeSlot.end
            },
            room: entries.map(e => ({
              id: e.roomId,
              name: e.room.name
            }))
          },
          resolutionSuggestions: [
            'Move one course to a different time slot',
            'Drop one of the conflicting courses',
            'Contact academic advisor for guidance'
          ]
        })
      }
    }

    // Create conflict records
    if (conflicts.length > 0) {
      await prisma.studentConflict.createMany({
        data: conflicts
      })
    }

    return conflicts.length

  } catch (error) {
    console.error('Error detecting schedule conflicts:', error)
    return 0
  }
}