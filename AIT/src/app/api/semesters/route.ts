import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating a semester
const createSemesterSchema = z.object({
  number: z.number().int().min(1, 'Semester number must be at least 1').max(8, 'Semester number cannot exceed 8'),
  programId: z.number().int().positive('Program ID is required')
})

// GET /api/semesters - List all semesters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    
    const whereClause = programId ? { programId: parseInt(programId) } : {}
    
    const semesters = await prisma.semester.findMany({
      where: whereClause,
      include: {
        program: true,
        courses: {
          include: {
            faculty: true
          }
        }
      },
      orderBy: [
        { program: { name: 'asc' } },
        { number: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: semesters
    })
  } catch (error) {
    console.error('Error fetching semesters:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch semesters'
      },
      { status: 500 }
    )
  }
}

// POST /api/semesters - Create a new semester
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createSemesterSchema.parse(body)
    
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
    
    // Check if semester already exists for this program
    const existingSemester = await prisma.semester.findFirst({
      where: {
        programId: validatedData.programId,
        number: validatedData.number
      }
    })
    
    if (existingSemester) {
      return NextResponse.json(
        {
          success: false,
          error: `Semester ${validatedData.number} already exists for this program`
        },
        { status: 409 }
      )
    }
    
    // Create the semester
    const semester = await prisma.semester.create({
      data: {
        number: validatedData.number,
        programId: validatedData.programId
      },
      include: {
        program: true,
        courses: true
      }
    })
    
    return NextResponse.json(
      {
        success: true,
        data: semester,
        message: 'Semester created successfully'
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
    
    console.error('Error creating semester:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create semester'
      },
      { status: 500 }
    )
  }
}