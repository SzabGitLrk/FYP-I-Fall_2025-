import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studentSchema = z.object({
  regId: z.string().min(1, 'Registration ID is required'),
  regName: z.string().min(1, 'Registration Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  programId: z.number().int().positive().optional(),
  semesterId: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    const semesterId = searchParams.get('semesterId')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (programId) {
      where.programId = parseInt(programId)
    }
    
    if (semesterId) {
      where.semesterId = parseInt(semesterId)
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const students = await prisma.student.findMany({
      where,
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
      },
      orderBy: {
        regId: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = studentSchema.parse(body)

    // Check if regId already exists
    const existingStudent = await prisma.student.findUnique({
      where: { regId: validatedData.regId }
    })

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'A student with this Registration ID already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingEmail = await prisma.student.findUnique({
        where: { email: validatedData.email }
      })

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'A student with this email already exists' },
          { status: 400 }
        )
      }
    }

    const studentData: any = {
      regId: validatedData.regId,
      regName: validatedData.regName,
      isActive: validatedData.isActive,
    }

    if (validatedData.email) studentData.email = validatedData.email
    if (validatedData.phone) studentData.phone = validatedData.phone
    if (validatedData.address) studentData.address = validatedData.address
    if (validatedData.programId) studentData.programId = validatedData.programId
    if (validatedData.semesterId) studentData.semesterId = validatedData.semesterId
    if (validatedData.dateOfBirth) {
      studentData.dateOfBirth = new Date(validatedData.dateOfBirth)
    }

    const student = await prisma.student.create({
      data: studentData,
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
      message: 'Student created successfully'
    })
  } catch (error) {
    console.error('Error creating student:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    )
  }
}