import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/students/[id]/conflicts - Get student's schedule conflicts
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

    // Get student's conflicts
    const conflicts = await prisma.studentConflict.findMany({
      where: {
        studentId: studentId
      },
      orderBy: [
        { severity: 'desc' },
        { detectedAt: 'desc' }
      ]
    })

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        regId: true,
        regName: true,
        program: {
          select: {
            name: true,
            code: true
          }
        },
        semester: {
          select: {
            number: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Categorize conflicts
    const conflictSummary = {
      total: conflicts.length,
      pending: conflicts.filter(c => c.resolutionStatus === 'PENDING').length,
      resolved: conflicts.filter(c => c.resolutionStatus === 'RESOLVED').length,
      ignored: conflicts.filter(c => c.resolutionStatus === 'IGNORED').length,
      escalated: conflicts.filter(c => c.resolutionStatus === 'ESCALATED').length,
      bySeverity: {
        CRITICAL: conflicts.filter(c => c.severity === 'CRITICAL').length,
        HIGH: conflicts.filter(c => c.severity === 'HIGH').length,
        MEDIUM: conflicts.filter(c => c.severity === 'MEDIUM').length,
        LOW: conflicts.filter(c => c.severity === 'LOW').length
      },
      byType: {
        SCHEDULING_CONFLICT: conflicts.filter(c => c.conflictType === 'SCHEDULING_CONFLICT').length,
        RESOURCE_CONFLICT: conflicts.filter(c => c.conflictType === 'RESOURCE_CONFLICT').length,
        CAPACITY_CONFLICT: conflicts.filter(c => c.conflictType === 'CAPACITY_CONFLICT').length,
        PREFERENCE_CONFLICT: conflicts.filter(c => c.conflictType === 'PREFERENCE_CONFLICT').length,
        EQUIPMENT_CONFLICT: conflicts.filter(c => c.conflictType === 'EQUIPMENT_CONFLICT').length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        student,
        conflicts,
        summary: conflictSummary
      }
    })

  } catch (error) {
    console.error('Error fetching student conflicts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student conflicts' },
      { status: 500 }
    )
  }
}

// POST /api/students/[id]/conflicts - Create a new conflict record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)
    const conflictData = await request.json()

    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    // Validate required fields
    const { conflictType, severity, title, description, affectedCourses, timeSlotInfo } = conflictData

    if (!conflictType || !severity || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required conflict data' },
        { status: 400 }
      )
    }

    // Create conflict record
    const conflict = await prisma.studentConflict.create({
      data: {
        studentId,
        conflictType,
        severity,
        title,
        description,
        affectedCourses: affectedCourses || [],
        timeSlotInfo: timeSlotInfo || {},
        resolutionSuggestions: conflictData.resolutionSuggestions || []
      }
    })

    return NextResponse.json({
      success: true,
      data: conflict,
      message: 'Conflict record created successfully'
    })

  } catch (error) {
    console.error('Error creating conflict record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create conflict record' },
      { status: 500 }
    )
  }
}