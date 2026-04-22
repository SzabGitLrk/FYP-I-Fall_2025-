import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/conflicts/resolve - Resolve student schedule conflicts
export async function POST(request: NextRequest) {
  try {
    const { conflictId, resolutionAction, resolutionNotes, resolvedBy } = await request.json()

    if (!conflictId || !resolutionAction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: conflictId and resolutionAction' },
        { status: 400 }
      )
    }

    // Get the conflict
    const conflict = await prisma.studentConflict.findUnique({
      where: { id: conflictId },
      include: {
        student: {
          include: {
            program: true,
            semester: true
          }
        }
      }
    })

    if (!conflict) {
      return NextResponse.json(
        { success: false, error: 'Conflict not found' },
        { status: 404 }
      )
    }

    // Process resolution based on action type
    let resolutionResult = null
    
    switch (resolutionAction) {
      case 'DROP_COURSE':
        resolutionResult = await dropConflictingCourse(conflict, resolutionNotes)
        break
      
      case 'RESCHEDULE_COURSE':
        resolutionResult = await rescheduleConflictingCourse(conflict, resolutionNotes)
        break
      
      case 'IGNORE_CONFLICT':
        resolutionResult = await ignoreConflict(conflict, resolutionNotes)
        break
      
      case 'ESCALATE_CONFLICT':
        resolutionResult = await escalateConflict(conflict, resolutionNotes)
        break
      
      case 'MANUAL_RESOLUTION':
        resolutionResult = await manualResolution(conflict, resolutionNotes)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid resolution action' },
          { status: 400 }
        )
    }

    // Update conflict status
    const updatedConflict = await prisma.studentConflict.update({
      where: { id: conflictId },
      data: {
        resolutionStatus: resolutionResult.status,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || 'System',
        resolutionNotes: resolutionNotes || resolutionResult.notes
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        conflict: updatedConflict,
        resolution: resolutionResult
      },
      message: `Conflict ${resolutionResult.status.toLowerCase()} successfully`
    })

  } catch (error) {
    console.error('Error resolving conflict:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resolve conflict' },
      { status: 500 }
    )
  }
}

// Helper functions for different resolution actions

async function dropConflictingCourse(conflict: any, notes: string) {
  try {
    // Get affected courses from conflict data
    const affectedCourses = conflict.affectedCourses as any[]
    
    if (!affectedCourses || affectedCourses.length === 0) {
      throw new Error('No affected courses found in conflict data')
    }

    // For now, we'll mark the first course for dropping (in real implementation, this would be user-selected)
    const courseToDropId = affectedCourses[0].id

    // Deactivate enrollment
    await prisma.enrollment.updateMany({
      where: {
        studentId: conflict.studentId,
        courseId: courseToDropId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Remove from student schedule
    await prisma.studentSchedule.deleteMany({
      where: {
        studentId: conflict.studentId,
        courseId: courseToDropId
      }
    })

    return {
      status: 'RESOLVED',
      notes: `Dropped course ${affectedCourses[0].name} (${affectedCourses[0].code}). ${notes || ''}`,
      action: 'COURSE_DROPPED',
      details: {
        droppedCourse: affectedCourses[0]
      }
    }

  } catch (error) {
    console.error('Error dropping course:', error)
    return {
      status: 'ESCALATED',
      notes: `Failed to drop course automatically: ${error.message}. ${notes || ''}`,
      action: 'DROP_FAILED'
    }
  }
}

async function rescheduleConflictingCourse(conflict: any, notes: string) {
  // This would require integration with the timetable generation algorithm
  // For now, we'll mark it as escalated for manual handling
  return {
    status: 'ESCALATED',
    notes: `Course rescheduling requires manual intervention. ${notes || ''}`,
    action: 'RESCHEDULE_REQUESTED',
    details: {
      requiresManualScheduling: true
    }
  }
}

async function ignoreConflict(conflict: any, notes: string) {
  // Mark schedule entries as acceptable conflicts
  await prisma.studentSchedule.updateMany({
    where: {
      studentId: conflict.studentId,
      isConflict: true
    },
    data: {
      conflictReason: `Conflict acknowledged and ignored: ${notes || 'Administrative decision'}`
    }
  })

  return {
    status: 'IGNORED',
    notes: `Conflict ignored as per administrative decision. ${notes || ''}`,
    action: 'CONFLICT_IGNORED'
  }
}

async function escalateConflict(conflict: any, notes: string) {
  return {
    status: 'ESCALATED',
    notes: `Conflict escalated for higher-level review. ${notes || ''}`,
    action: 'CONFLICT_ESCALATED',
    details: {
      requiresAdminReview: true
    }
  }
}

async function manualResolution(conflict: any, notes: string) {
  return {
    status: 'RESOLVED',
    notes: `Conflict resolved manually. ${notes || ''}`,
    action: 'MANUAL_RESOLUTION'
  }
}

// GET /api/conflicts/resolve - Get resolution options for conflicts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conflictId = searchParams.get('conflictId')

    if (!conflictId) {
      return NextResponse.json(
        { success: false, error: 'Missing conflictId parameter' },
        { status: 400 }
      )
    }

    // Get conflict details
    const conflict = await prisma.studentConflict.findUnique({
      where: { id: parseInt(conflictId) },
      include: {
        student: {
          include: {
            program: true,
            semester: true
          }
        }
      }
    })

    if (!conflict) {
      return NextResponse.json(
        { success: false, error: 'Conflict not found' },
        { status: 404 }
      )
    }

    // Generate resolution options based on conflict type
    const resolutionOptions = []

    if (conflict.conflictType === 'SCHEDULING_CONFLICT') {
      resolutionOptions.push(
        {
          action: 'DROP_COURSE',
          title: 'Drop Conflicting Course',
          description: 'Remove one of the conflicting courses from student schedule',
          severity: 'HIGH',
          automated: true
        },
        {
          action: 'RESCHEDULE_COURSE',
          title: 'Reschedule Course',
          description: 'Move one course to a different time slot',
          severity: 'MEDIUM',
          automated: false
        },
        {
          action: 'IGNORE_CONFLICT',
          title: 'Ignore Conflict',
          description: 'Accept the conflict and allow overlapping schedules',
          severity: 'LOW',
          automated: true
        }
      )
    }

    // Always include manual and escalation options
    resolutionOptions.push(
      {
        action: 'MANUAL_RESOLUTION',
        title: 'Manual Resolution',
        description: 'Mark as resolved with custom notes',
        severity: 'MEDIUM',
        automated: false
      },
      {
        action: 'ESCALATE_CONFLICT',
        title: 'Escalate to Administrator',
        description: 'Forward to higher-level administrator for review',
        severity: 'LOW',
        automated: true
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        conflict,
        resolutionOptions
      }
    })

  } catch (error) {
    console.error('Error getting resolution options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get resolution options' },
      { status: 500 }
    )
  }
}