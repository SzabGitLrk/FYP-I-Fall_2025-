import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createEnrollmentSchema = z.object({
  studentId: z.number().int().positive('Student ID is required'),
  courseId: z.number().int().positive('Course ID is required'),
  isActive: z.boolean().optional().default(true),
})

// GET /api/enrollments - List all enrollments
export async function GET() {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: {
          include: {
            program: true,
            semester: true,
          }
        },
        course: {
          include: {
            semester: {
              include: {
                program: true,
              }
            },
            faculty: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: enrollments
    })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch enrollments'
      },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Create a new enrollment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createEnrollmentSchema.parse(body)
    
    // Check if student exists and fetch their program
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        program: true
      }
    })
    
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }
    
    if (!student.programId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student is not enrolled in any program'
        },
        { status: 400 }
      )
    }
    
    // Check if course exists and fetch its program through semester
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      include: {
        semester: {
          include: {
            program: true
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
    
    // Validate that student's program matches course's program
    if (student.programId !== course.semester.programId) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot enroll student in this course. Student is enrolled in ${student.program?.name || 'a different program'}, but this course belongs to ${course.semester.program.name}`
        },
        { status: 400 }
      )
    }
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: validatedData.studentId,
          courseId: validatedData.courseId
        }
      }
    })
    
    if (existingEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student is already enrolled in this course'
        },
        { status: 409 }
      )
    }
    
    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: validatedData.studentId,
        courseId: validatedData.courseId,
        isActive: validatedData.isActive,
      },
      include: {
        student: true,
        course: true,
      }
    })
    
    return NextResponse.json(
      {
        success: true,
        data: enrollment,
        message: 'Student enrolled successfully'
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
    
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create enrollment'
      },
      { status: 500 }
    )
  }
}


// DELETE /api/enrollments - Delete an enrollment (unenroll student)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { studentId, courseId } = body
    
    if (!studentId || !courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId and courseId are required'
        },
        { status: 400 }
      )
    }
    
    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId)
        }
      }
    })
    
    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enrollment not found'
        },
        { status: 404 }
      )
    }
    
    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        id: enrollment.id
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Student unenrolled successfully'
    })
  } catch (error) {
    console.error('Error deleting enrollment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete enrollment'
      },
      { status: 500 }
    )
  }
}
