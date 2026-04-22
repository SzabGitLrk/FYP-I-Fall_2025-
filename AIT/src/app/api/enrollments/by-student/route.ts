import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/enrollments/by-student - Fetch all students with their enrollments grouped by student
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        program: {
          include: {
            department: true
          }
        },
        enrollments: {
          include: {
            course: {
              include: {
                semester: true
              }
            }
          },
          orderBy: {
            enrolledAt: 'desc'
          }
        },
        _count: {
          select: {
            enrollments: true
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
    console.error('Error fetching students with enrollments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch students with enrollments'
      },
      { status: 500 }
    )
  }
}
