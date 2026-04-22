import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studentUpdateSchema = z.object({
  regId: z.string().min(1, 'Registration ID is required').optional(),
  regName: z.string().min(1, 'Registration Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  programId: z.number().int().positive().optional(),
  semesterId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            department: true
          }
        },
        semester: true,
        enrollments: {
          include: {
            course: {
              include: {
                faculty: true,
                semester: {
                  include: {
                    program: true
                  }
                }
              }
            }
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

    return NextResponse.json({
      success: true,
      data: student
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = studentUpdateSchema.parse(body)

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if regId already exists (if being updated)
    if (validatedData.regId && validatedData.regId !== existingStudent.regId) {
      const regIdExists = await prisma.student.findUnique({
        where: { regId: validatedData.regId }
      })

      if (regIdExists) {
        return NextResponse.json(
          { success: false, error: 'A student with this Registration ID already exists' },
          { status: 400 }
        )
      }
    }

    // Check if email already exists (if being updated)
    if (validatedData.email && validatedData.email !== existingStudent.email) {
      const emailExists = await prisma.student.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'A student with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (validatedData.regId) updateData.regId = validatedData.regId
    if (validatedData.regName) updateData.regName = validatedData.regName
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.programId !== undefined) updateData.programId = validatedData.programId || null
    if (validatedData.semesterId !== undefined) updateData.semesterId = validatedData.semesterId || null
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.dateOfBirth !== undefined) {
      updateData.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        program: {
          include: {
            department: true
          }
        },
        semester: true,
        enrollments: {
          include: {
            course: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    })
  } catch (error) {
    console.error('Error updating student:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Delete student (this will cascade delete enrollments)
    await prisma.student.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}