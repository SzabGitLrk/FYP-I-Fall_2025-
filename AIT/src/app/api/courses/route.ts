import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { CourseType } from '@prisma/client'

// Validation schema for creating a course
const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(200, 'Course name too long'),
  code: z.string().max(20, 'Course code too long').optional().or(z.literal("")),
  type: z.nativeEnum(CourseType, { message: 'Course type must be THEORY or LAB' }),
  semesterId: z.number().int().positive('Semester is required'),
  facultyId: z.number().int().positive().optional()
})

// GET /api/courses - List all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semesterId')
    const programId = searchParams.get('programId')
    
    const whereClause: {
      semesterId?: number
      semester?: {
        programId: number
      }
    } = {}
    
    if (semesterId) {
      whereClause.semesterId = parseInt(semesterId)
    }
    
    if (programId) {
      whereClause.semester = {
        programId: parseInt(programId)
      }
    }
    
    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        semester: {
          include: {
            program: true
          }
        },
        faculty: true,
        timetable: true,
        enrollments: {
          include: {
            student: true
          }
        }
      },
      orderBy: [
        { semester: { program: { name: 'asc' } } },
        { semester: { number: 'asc' } },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: courses
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses'
      },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createCourseSchema.parse(body)
    
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
    
    // Check if course code already exists (only if code is provided)
    if (validatedData.code && validatedData.code.trim() !== '') {
      const existingCourse = await prisma.course.findFirst({
        where: {
          code: validatedData.code
        }
      })
      
      if (existingCourse) {
        return NextResponse.json(
          {
            success: false,
            error: 'A course with this code already exists'
          },
          { status: 409 }
        )
      }
    }

    // Check if course with same name already exists in the same semester
    // (unless the code is different, then it's allowed)
    const existingCourseWithSameName = await prisma.course.findFirst({
      where: {
        name: validatedData.name,
        semesterId: validatedData.semesterId
      }
    })
    
    if (existingCourseWithSameName) {
      // If a course with same name exists in same semester, check if code is different
      const codeIsDifferent = validatedData.code && validatedData.code.trim() !== '' 
        ? validatedData.code !== existingCourseWithSameName.code
        : !existingCourseWithSameName.code
      
      if (!codeIsDifferent) {
        return NextResponse.json(
          {
            success: false,
            error: 'A course with this name already exists in this semester. Please use a different course code.'
          },
          { status: 409 }
        )
      }
    }
    
    // Create the course
    const course = await prisma.course.create({
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
    
    return NextResponse.json(
      {
        success: true,
        data: course,
        message: 'Course created successfully'
      },
      { status: 201 }
    )
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
    
    console.error('Error creating course:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create course'
      },
      { status: 500 }
    )
  }
}