import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/students/by-semester?semesterId=1 - Fetch students by semester
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semesterId')

    if (!semesterId) {
      return NextResponse.json(
        {
          success: false,
          error: 'semesterId is required'
        },
        { status: 400 }
      )
    }

    const students = await prisma.student.findMany({
      where: {
        semesterId: parseInt(semesterId),
        isActive: true
      },
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
    console.error('Error fetching students by semester:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch students by semester'
      },
      { status: 500 }
    )
  }
}
