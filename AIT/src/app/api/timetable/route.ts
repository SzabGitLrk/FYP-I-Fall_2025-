import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/timetable - Get current timetable with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    const semesterId = searchParams.get('semesterId')
    
    // Build where clause for filtering
    const whereClause: {
      course?: {
        semesterId?: number
        semester?: {
          programId: number
        }
      }
    } = {}
    
    if (semesterId) {
      whereClause.course = {
        semesterId: parseInt(semesterId)
      }
    } else if (programId) {
      whereClause.course = {
        semester: {
          programId: parseInt(programId)
        }
      }
    }
    
    const timetable = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        course: {
          include: {
            semester: {
              include: {
                program: {
                  include: {
                    department: true
                  }
                }
              }
            },
            faculty: true,
            enrollments: {
              where: {
                isActive: true
              },
              include: {
                student: {
                  select: {
                    id: true,
                    regId: true,
                    regName: true
                  }
                }
              }
            },
            enhancement: true
          }
        },
        room: {
          include: {
            enhancement: true
          }
        },
        timeslot: true,
        faculty: true
      },
      orderBy: [
        { day: 'asc' },
        { timeslot: { start: 'asc' } },
        { course: { name: 'asc' } }
      ]
    })

    return NextResponse.json({
      success: true,
      data: timetable
    })
  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch timetable'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/timetable - Clear existing timetable
export async function DELETE() {
  try {
    await prisma.timetable.deleteMany()
    
    return NextResponse.json({
      success: true,
      message: 'Timetable cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing timetable:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear timetable'
      },
      { status: 500 }
    )
  }
}