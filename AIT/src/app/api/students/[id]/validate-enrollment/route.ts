import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/students/[id]/validate-enrollment - Validate enrollment for conflicts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)
    const { courseId } = await request.json()

    if (isNaN(studentId) || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID or course ID' },
        { status: 400 }
      )
    }

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

    // Get course info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        semester: {
          include: {
            program: true
          }
        },
        timetable: {
          include: {
            timeSlot: true,
            room: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Perform validation checks
    const validationResults = {
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[],
      conflicts: [] as any[],
      recommendations: [] as string[]
    }

    // 1. Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        courseId: courseId,
        isActive: true
      }
    })

    if (existingEnrollment) {
      validationResults.errors.push('Student is already enrolled in this course')
      validationResults.isValid = false
    }

    // 2. Check program compatibility
    if (student.programId !== course.semester.programId) {
      validationResults.warnings.push(
        `Cross-program enrollment: Student is in ${student.program?.name} but course is in ${course.semester.program.name}`
      )
      validationResults.recommendations.push('Verify cross-program enrollment is allowed')
    }

    // 3. Check semester compatibility
    if (student.semesterId !== course.semesterId) {
      const semesterDiff = Math.abs((student.semester?.number || 0) - course.semester.number)
      if (semesterDiff > 2) {
        validationResults.warnings.push(
          `Large semester gap: Student is in semester ${student.semester?.number} but course is for semester ${course.semester.number}`
        )
      } else {
        validationResults.warnings.push(
          `Cross-semester enrollment: Student is in semester ${student.semester?.number} but course is for semester ${course.semester.number}`
        )
      }
    }

    // 4. Check schedule conflicts
    if (course.timetable.length > 0) {
      const studentSchedule = await prisma.studentSchedule.findMany({
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

      for (const courseTimeSlot of course.timetable) {
        const conflictingSchedule = studentSchedule.find(schedule =>
          schedule.day === courseTimeSlot.day &&
          schedule.timeSlotId === courseTimeSlot.timeSlotId
        )

        if (conflictingSchedule) {
          validationResults.conflicts.push({
            type: 'SCHEDULE_CONFLICT',
            day: courseTimeSlot.day,
            timeSlot: {
              start: courseTimeSlot.timeSlot.start,
              end: courseTimeSlot.timeSlot.end
            },
            conflictingCourse: {
              id: conflictingSchedule.courseId,
              name: conflictingSchedule.course.name,
              code: conflictingSchedule.course.code
            },
            room: {
              current: conflictingSchedule.room.name,
              new: courseTimeSlot.room.name
            }
          })

          validationResults.errors.push(
            `Schedule conflict on ${courseTimeSlot.day} at ${courseTimeSlot.timeSlot.start}-${courseTimeSlot.timeSlot.end} with ${conflictingSchedule.course.name}`
          )
          validationResults.isValid = false
        }
      }
    }

    // 5. Check capacity constraints
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        courseId: courseId,
        isActive: true
      }
    })

    const courseEnhancement = await prisma.courseEnhancement.findUnique({
      where: { courseId: courseId }
    })

    const maxEnrollment = courseEnhancement?.maxEnrollment || 50
    if (enrollmentCount >= maxEnrollment) {
      validationResults.errors.push(`Course is at maximum capacity (${enrollmentCount}/${maxEnrollment})`)
      validationResults.isValid = false
    } else if (enrollmentCount >= maxEnrollment * 0.9) {
      validationResults.warnings.push(`Course is near capacity (${enrollmentCount}/${maxEnrollment})`)
    }

    // 6. Generate recommendations
    if (validationResults.conflicts.length > 0) {
      validationResults.recommendations.push('Consider dropping conflicting courses or finding alternative sections')
    }

    if (validationResults.warnings.length > 0 && validationResults.errors.length === 0) {
      validationResults.recommendations.push('Enrollment is possible but requires attention to warnings')
    }

    if (validationResults.isValid && validationResults.warnings.length === 0) {
      validationResults.recommendations.push('Enrollment looks good with no issues detected')
    }

    // 7. Save validation record
    await prisma.enrollmentValidation.create({
      data: {
        studentId: studentId,
        courseId: courseId,
        validationType: 'COMPREHENSIVE_CHECK',
        validationStatus: validationResults.isValid ? 'PASSED' : 'FAILED',
        message: validationResults.isValid 
          ? 'Enrollment validation passed'
          : `Enrollment validation failed: ${validationResults.errors.join(', ')}`,
        details: {
          warnings: validationResults.warnings,
          errors: validationResults.errors,
          conflicts: validationResults.conflicts,
          recommendations: validationResults.recommendations
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        validation: validationResults,
        student: {
          id: student.id,
          regId: student.regId,
          regName: student.regName,
          program: student.program?.name,
          semester: student.semester?.number
        },
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
          semester: course.semester.number,
          program: course.semester.program.name
        }
      }
    })

  } catch (error) {
    console.error('Error validating enrollment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate enrollment' },
      { status: 500 }
    )
  }
}