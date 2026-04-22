import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { CourseType } from '@prisma/client'

// Validation schema for updating a course
const updateCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(200, 'Course name too long'),
  code: z.string().max(20, 'Course code too long').optional().or(z.literal("")),
  type: z.nativeEnum(CourseType, { message: 'Course type must be THEORY or LAB' }),
  semesterId: z.number().int().positive('Semester is required'),
  facultyId: z.number().int().positive().optional()
})

// GET /api/courses/[id] - Get a specific course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courseId = parseInt(id)
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid course ID'
        },
        { status: 400 }
      )
    }
    
    const course = await prisma.course.findUnique({
      where: {
        id: courseId
      },
      include: {
        semester: {
          include: {
            program: true
          }
        },
        faculty: true,
        timetable: {
          include: {
            room: true,
            timeslot: true
          }
        }
      }
    })
    
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: course
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch course'
      },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[id] - Update a specific course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courseId = parseInt(id)
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid course ID'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)
    
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })
    
    if (!existingCourse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found'
        },
        { status: 404 }
      )
    }
    
    // Check if semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: validatedData.semesterId },
      include: { program: true }
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
    
    // Check if faculty exists (if provided)
    if (validatedData.facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: validatedData.facultyId }
      })
      
      if (!faculty) {
        return NextResponse.json(
          {
            success: false,
            error: 'Faculty not found'
          },
          { status: 404 }
        )
      }
    }
    
    // Check if another course with same code exists (only if code is provided)
    if (validatedData.code && validatedData.code.trim() !== '') {
      const duplicateCourse = await prisma.course.findFirst({
        where: {
          code: validatedData.code,
          id: { not: courseId }
        }
      })
      
      if (duplicateCourse) {
        return NextResponse.json(
          {
            success: false,
            error: 'A course with this code already exists'
          },
          { status: 409 }
        )
      }
    }
    
    // Update the course
    const updatedCourse = await prisma.course.update({
      where: {
        id: courseId
      },
      data: {
        name: validatedData.name,
        code: validatedData.code && validatedData.code.trim() !== '' ? validatedData.code : null,
        type: validatedData.type,
        semesterId: validatedData.semesterId,
        facultyId: validatedData.facultyId || null
      },
      include: {
        semester: {
          include: {
            program: true
          }
        },
        faculty: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
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
    
    console.error('Error updating course:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update course'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - Delete a specific course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courseId = parseInt(id)
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid course ID'
        },
        { status: 400 }
      )
    }
    
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        timetable: true
      }
    })
    
    if (!existingCourse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found'
        },
        { status: 404 }
      )
    }
    
    // Delete the course (cascade will handle timetable entries)
    await prisma.course.delete({
      where: {
        id: courseId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete course'
      },
      { status: 500 }
    )
  }
}