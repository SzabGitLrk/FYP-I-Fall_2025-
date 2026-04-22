import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating faculty
const createFacultySchema = z.object({
  name: z.string().min(1, 'Faculty name is required').max(100, 'Faculty name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long')
})

// GET /api/faculty - List all faculty
export async function GET() {
  try {
    const faculty = await prisma.faculty.findMany({
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
        timetable: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: faculty
    })
  } catch (error) {
    console.error('Error fetching faculty:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch faculty'
      },
      { status: 500 }
    )
  }
}

// POST /api/faculty - Create a new faculty member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createFacultySchema.parse(body)
    
    // Check if faculty with same email already exists
    const existingFaculty = await prisma.faculty.findFirst({
      where: {
        email: validatedData.email
      }
    })
    
    if (existingFaculty) {
      return NextResponse.json(
        {
          success: false,
          error: 'A faculty member with this email already exists'
        },
        { status: 409 }
      )
    }
    
    // Create the faculty member
    const faculty = await prisma.faculty.create({
      data: {
        name: validatedData.name,
        email: validatedData.email
      },
      include: {
        courses: true
      }
    })
    
    return NextResponse.json(
      {
        success: true,
        data: faculty,
        message: 'Faculty member created successfully'
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
    
    console.error('Error creating faculty:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create faculty member'
      },
      { status: 500 }
    )
  }
}