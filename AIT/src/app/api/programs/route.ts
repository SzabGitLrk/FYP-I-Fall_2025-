import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating a program
const createProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required').max(100, 'Program name too long'),
  code: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().min(0.5).max(10).optional(),
  departmentId: z.number().min(1, 'Department is required'),
})

// GET /api/programs - List all programs
export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: {
        department: true,
        semesters: {
          include: {
            courses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: programs
    })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch programs'
      },
      { status: 500 }
    )
  }
}

// POST /api/programs - Create a new program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createProgramSchema.parse(body)
    
    // Check if program with same name or code already exists
    const existingProgram = await prisma.program.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          ...(validatedData.code ? [{ code: validatedData.code }] : [])
        ]
      }
    })
    
    if (existingProgram) {
      return NextResponse.json(
        {
          success: false,
          error: existingProgram.name === validatedData.name 
            ? 'A program with this name already exists'
            : 'A program with this code already exists'
        },
        { status: 409 }
      )
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId }
    })

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not found'
        },
        { status: 404 }
      )
    }

    // Calculate number of semesters (2 per year, rounded up for decimal durations)
    const duration = validatedData.duration || 4
    const numberOfSemesters = Math.ceil(duration * 2)

    // Create the program with semesters
    const program = await prisma.program.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        duration: duration,
        departmentId: validatedData.departmentId,
        semesters: {
          create: Array.from({ length: numberOfSemesters }, (_, i) => ({
            number: i + 1
          }))
        }
      },
      include: {
        department: true,
        semesters: {
          orderBy: {
            number: 'asc'
          }
        }
      }
    })
    
    return NextResponse.json(
      {
        success: true,
        data: program,
        message: `Program created successfully with ${numberOfSemesters} semesters`
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
    
    console.error('Error creating program:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create program'
      },
      { status: 500 }
    )
  }
}
