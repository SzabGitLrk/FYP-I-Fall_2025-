import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating faculty
const updateFacultySchema = z.object({
  name: z.string().min(1, 'Faculty name is required').max(100, 'Faculty name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long')
})

// GET /api/faculty/[id] - Get a specific faculty member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facultyId = parseInt(id)
    
    if (isNaN(facultyId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid faculty ID'
        },
        { status: 400 }
      )
    }
    
    const faculty = await prisma.faculty.findUnique({
      where: {
        id: facultyId
      },
      include: {
        courses: {
          include: {
            semester: {
              include: {
                program: true
              }
            }
          },
          orderBy: [
            { semester: { program: { name: 'asc' } } },
            { semester: { number: 'asc' } },
            { name: 'asc' }
          ]
        },
        timetable: {
          include: {
            course: true,
            room: true,
            timeslot: true
          }
        }
      }
    })
    
    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faculty member not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: faculty
    })
  } catch (error) {
    console.error('Error fetching faculty:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch faculty member'
      },
      { status: 500 }
    )
  }
}

// PUT /api/faculty/[id] - Update a specific faculty member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facultyId = parseInt(id)
    
    if (isNaN(facultyId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid faculty ID'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateFacultySchema.parse(body)
    
    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    })
    
    if (!existingFaculty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faculty member not found'
        },
        { status: 404 }
      )
    }
    
    // Check if another faculty with same email exists
    const duplicateFaculty = await prisma.faculty.findFirst({
      where: {
        email: validatedData.email,
        id: { not: facultyId }
      }
    })
    
    if (duplicateFaculty) {
      return NextResponse.json(
        {
          success: false,
          error: 'A faculty member with this email already exists'
        },
        { status: 409 }
      )
    }
    
    // Update the faculty member
    const updatedFaculty = await prisma.faculty.update({
      where: {
        id: facultyId
      },
      data: {
        name: validatedData.name,
        email: validatedData.email
      },
      include: {
        courses: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedFaculty,
      message: 'Faculty member updated successfully'
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
    
    console.error('Error updating faculty:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update faculty member'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/faculty/[id] - Delete a specific faculty member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facultyId = parseInt(id)
    
    if (isNaN(facultyId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid faculty ID'
        },
        { status: 400 }
      )
    }
    
    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        courses: true,
        timetable: true
      }
    })
    
    if (!existingFaculty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faculty member not found'
        },
        { status: 404 }
      )
    }
    
    // Check if faculty is assigned to any courses
    if (existingFaculty.courses.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete faculty member who is assigned to courses. Please reassign or remove the courses first.'
        },
        { status: 409 }
      )
    }
    
    // Delete the faculty member
    await prisma.faculty.delete({
      where: {
        id: facultyId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Faculty member deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting faculty:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete faculty member'
      },
      { status: 500 }
    )
  }
}