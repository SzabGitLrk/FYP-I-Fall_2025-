import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating a program
const updateProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required').max(100, 'Program name too long'),
  code: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
  departmentId: z.number().min(1, 'Department is required')
})

// GET /api/programs/[id] - Get a specific program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const programId = parseInt(id)
    
    if (isNaN(programId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid program ID'
        },
        { status: 400 }
      )
    }
    
    const program = await prisma.program.findUnique({
      where: {
        id: programId
      },
      include: {
        semesters: {
          include: {
            courses: {
              include: {
                faculty: true
              }
            }
          },
          orderBy: {
            number: 'asc'
          }
        }
      }
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
    
    return NextResponse.json({
      success: true,
      data: program
    })
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch program'
      },
      { status: 500 }
    )
  }
}

// PUT /api/programs/[id] - Update a specific program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const programId = parseInt(id)
    
    if (isNaN(programId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid program ID'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateProgramSchema.parse(body)
    
    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: programId }
    })
    
    if (!existingProgram) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program not found'
        },
        { status: 404 }
      )
    }
    
    // Check if another program with same name or code exists
    const duplicateProgram = await prisma.program.findFirst({
      where: {
        OR: [
          { name: validatedData.name, id: { not: programId } },
          ...(validatedData.code ? [{ code: validatedData.code, id: { not: programId } }] : [])
        ]
      }
    })
    
    if (duplicateProgram) {
      return NextResponse.json(
        {
          success: false,
          error: duplicateProgram.name === validatedData.name
            ? 'A program with this name already exists'
            : 'A program with this code already exists'
        },
        { status: 409 }
      )
    }

    // Verify department exists if being updated
    if (validatedData.departmentId) {
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
    }

    // Check if duration changed - if so, adjust semesters
    const currentSemesterCount = await prisma.semester.count({
      where: { programId }
    })

    let semesterMessage = ''
    
    if (validatedData.duration && validatedData.duration !== existingProgram.duration) {
      const newSemesterCount = Math.ceil(validatedData.duration * 2)
      
      if (newSemesterCount > currentSemesterCount) {
        // Add new semesters
        const semestersToAdd = newSemesterCount - currentSemesterCount
        await prisma.semester.createMany({
          data: Array.from({ length: semestersToAdd }, (_, i) => ({
            number: currentSemesterCount + i + 1,
            programId: programId
          }))
        })
        semesterMessage = ` and added ${semestersToAdd} new semesters`
      } else if (newSemesterCount < currentSemesterCount) {
        // Remove excess semesters (only if they have no courses)
        const semestersToRemove = await prisma.semester.findMany({
          where: {
            programId,
            number: { gt: newSemesterCount }
          },
          include: {
            courses: true
          }
        })

        const semestersWithCourses = semestersToRemove.filter(s => s.courses.length > 0)
        
        if (semestersWithCourses.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Cannot reduce duration: Semesters ${semestersWithCourses.map(s => s.number).join(', ')} have courses assigned`
            },
            { status: 400 }
          )
        }

        await prisma.semester.deleteMany({
          where: {
            programId,
            number: { gt: newSemesterCount }
          }
        })
        semesterMessage = ` and removed ${semestersToRemove.length} semesters`
      }
    }
    
    // Update the program
    const updatedProgram = await prisma.program.update({
      where: {
        id: programId
      },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        duration: validatedData.duration,
        departmentId: validatedData.departmentId
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
    
    return NextResponse.json({
      success: true,
      data: updatedProgram,
      message: `Program updated successfully${semesterMessage}`
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
    
    console.error('Error updating program:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update program'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/programs/[id] - Delete a specific program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const programId = parseInt(id)
    
    if (isNaN(programId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid program ID'
        },
        { status: 400 }
      )
    }
    
    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        semesters: {
          include: {
            courses: true
          }
        }
      }
    })
    
    if (!existingProgram) {
      return NextResponse.json(
        {
          success: false,
          error: 'Program not found'
        },
        { status: 404 }
      )
    }
    
    // Delete the program (cascade will handle semesters and courses)
    await prisma.program.delete({
      where: {
        id: programId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete program'
      },
      { status: 500 }
    )
  }
}