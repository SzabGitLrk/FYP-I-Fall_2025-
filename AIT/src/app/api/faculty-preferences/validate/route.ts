import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/faculty-preferences/validate - Validate faculty preferences and detect conflicts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facultyId, preferences } = body

    if (!facultyId || !preferences) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID and preferences are required' },
        { status: 400 }
      )
    }

    // Get faculty information
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        courses: {
          include: {
            semester: {
              include: {
                program: true
              }
            }
          }
        },
        timetable: {
          include: {
            timeslot: true,
            course: true,
            room: true
          }
        }
      }
    })

    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      )
    }

    const validationResults = {
      isValid: true,
      warnings: [] as string[],
      conflicts: [] as any[],
      suggestions: [] as string[]
    }

    // Validate workload constraints
    if (preferences.maxDailyHours < 2) {
      validationResults.warnings.push('Maximum daily hours is very low (less than 2 hours)')
    }
    if (preferences.maxDailyHours > 10) {
      validationResults.warnings.push('Maximum daily hours is very high (more than 10 hours)')
    }

    if (preferences.maxConsecutiveHours > preferences.maxDailyHours) {
      validationResults.isValid = false
      validationResults.conflicts.push({
        type: 'WORKLOAD_CONFLICT',
        message: 'Maximum consecutive hours cannot exceed maximum daily hours'
      })
    }

    // Validate day preferences
    const preferredDays = preferences.preferredDays || []
    const unavailableDays = preferences.unavailableDays || []
    
    const conflictingDays = preferredDays.filter((day: string) => unavailableDays.includes(day))
    if (conflictingDays.length > 0) {
      validationResults.isValid = false
      validationResults.conflicts.push({
        type: 'DAY_PREFERENCE_CONFLICT',
        message: `Days marked as both preferred and unavailable: ${conflictingDays.join(', ')}`
      })
    }

    // Check if faculty has enough available days for their courses
    const totalAvailableDays = 7 - unavailableDays.length
    const coursesCount = faculty.courses.length
    
    if (totalAvailableDays < 2 && coursesCount > 0) {
      validationResults.warnings.push('Very limited availability may make scheduling difficult')
    }

    // Validate time slot preferences
    const preferredTimeSlots = preferences.preferredTimeSlots || []
    const unavailableTimeSlots = preferences.unavailableTimeSlots || []
    
    const conflictingTimeSlots = preferredTimeSlots.filter((pref: any) => 
      unavailableTimeSlots.some((unavail: any) => 
        unavail.timeSlotId === pref.timeSlotId && unavail.dayOfWeek === pref.dayOfWeek
      )
    )
    
    if (conflictingTimeSlots.length > 0) {
      validationResults.isValid = false
      validationResults.conflicts.push({
        type: 'TIME_PREFERENCE_CONFLICT',
        message: 'Some time slots are marked as both preferred and unavailable'
      })
    }

    // Check existing timetable conflicts
    const existingSchedule = faculty.timetable
    for (const entry of existingSchedule) {
      const isUnavailable = unavailableTimeSlots.some((unavail: any) => 
        unavail.timeSlotId === entry.timeSlotId && 
        (unavail.dayOfWeek === entry.day || unavail.dayOfWeek === 'ANY')
      )
      
      if (isUnavailable) {
        validationResults.conflicts.push({
          type: 'EXISTING_SCHEDULE_CONFLICT',
          message: `Existing class conflicts with unavailable time: ${entry.day} ${entry.timeslot.start}-${entry.timeslot.end}`,
          courseId: entry.courseId,
          courseName: entry.course.name
        })
      }
    }

    // Generate suggestions
    if (preferredDays.length === 0) {
      validationResults.suggestions.push('Consider setting preferred days to help optimize your schedule')
    }

    if (preferredTimeSlots.length === 0) {
      validationResults.suggestions.push('Setting preferred time slots can improve schedule quality')
    }

    if (preferences.maxCoursesPerDay > 4) {
      validationResults.suggestions.push('Consider limiting courses per day to 4 or fewer for better work-life balance')
    }

    // Calculate preference satisfaction score
    let satisfactionScore = 1.0
    
    if (validationResults.conflicts.length > 0) {
      satisfactionScore -= validationResults.conflicts.length * 0.2
    }
    
    if (validationResults.warnings.length > 0) {
      satisfactionScore -= validationResults.warnings.length * 0.1
    }
    
    satisfactionScore = Math.max(0, satisfactionScore)

    return NextResponse.json({
      success: true,
      data: {
        validation: validationResults,
        satisfactionScore,
        facultyInfo: {
          name: faculty.name,
          coursesCount: faculty.courses.length,
          currentScheduleCount: faculty.timetable.length
        }
      }
    })
  } catch (error) {
    console.error('Error validating faculty preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate faculty preferences' },
      { status: 500 }
    )
  }
}