import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating a semester
const updateSemesterSchema = z.object({
  number: z.number().int().min(1, 'Semester number must be at least 1').max(8, 'Semester number cannot exceed 8'),
  programId: z.number().int().positive('Program ID is required')
})

// GET /api/semesters/[id] - Get a specific semester
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const semesterId = parseInt(id)
    
    if (isNaN(semesterId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid semester ID'
        },
        { status: 400 }
      )
    }
    
    const semester = await prisma.semester.findUnique({
      where: {
        id: semesterId
      },
      include: {
        program: true,
        courses: {
          include: {
            faculty: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })
    
    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semester not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: semester
    })
  } catch (error) {
    console.error('Error fetching semester:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch semester'
      },
      { status: 500 }
    )
  }
}

// PUT /api/semesters/[id] - Update a specific semester
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const semesterId = parseInt(id)
    
    if (isNaN(semesterId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid semester ID'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateSemesterSchema.parse(body)
    
    // Check if semester exists
    const existingSemester = await prisma.semester.findUnique({
      where: { id: semesterId }
    })
    
    if (!existingSemester) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semester not found'
        },
        { status: 404 }
      )
    }
    
    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId }
    })
    
    if (!program) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program not found'
        },
        { status: 404 }
      )
    }
    
    // Check if another semester with same number exists for the program
    const duplicateSemester = await prisma.semester.findFirst({
      where: {
        programId: validatedData.programId,
        number: validatedData.number,
        id: { not: semesterId }
      }
    })
    
    if (duplicateSemester) {
      return NextResponse.json(
        {
          success: false,
          error: `Semester ${validatedData.number} already exists for this program`
        },
        { status: 409 }
      )
    }
    
    // Update the semester
    const updatedSemester = await prisma.semester.update({
      where: {
        id: semesterId
      },
      data: {
        number: validatedData.number,
        programId: validatedData.programId
      },
      include: {
        program: true,
        courses: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedSemester,
      message: 'Semester updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    console.error('Error updating semester:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update semester'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/semesters/[id] - Delete a specific semester
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const semesterId = parseInt(id)
    
    if (isNaN(semesterId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid semester ID'
        },
        { status: 400 }
      )
    }
    
    // Check if semester exists
    const existingSemester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: {
        courses: true
      }
    })
    
    if (!existingSemester) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semester not found'
        },
        { status: 404 }
      )
    }
    
    // Delete the semester (cascade will handle courses)
    await prisma.semester.delete({
      where: {
        id: semesterId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Semester deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting semester:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete semester'
      },
      { status: 500 }
    )
  }
}