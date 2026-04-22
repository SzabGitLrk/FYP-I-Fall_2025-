import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/faculty-workload-report - Generate faculty workload PDF report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    const semesterId = searchParams.get('semesterId')
    const facultyId = searchParams.get('facultyId')
    const format = searchParams.get('format') || 'detailed'
    const includeCharts = searchParams.get('includeCharts') === 'true'
    const colorScheme = searchParams.get('colorScheme') || 'professional'
    
    // Build where clause for filtering
    const whereClause: {
      course?: {
        semesterId?: number
        semester?: {
          programId: number
        }
      }
      facultyId?: number
    } = {}
    
    if (facultyId) {
      whereClause.facultyId = parseInt(facultyId)
    } else if (semesterId) {
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
    
    // Fetch timetable data with all necessary relations
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
        { faculty: { name: 'asc' } },
        { day: 'asc' },
        { timeslot: { start: 'asc' } }
      ]
    })

    if (!timetable || timetable.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No timetable data found for the specified criteria'
        },
        { status: 404 }
      )
    }

    // Transform data to match the expected interface
    const transformedEntries = timetable.map(entry => ({
      id: entry.id,
      day: entry.day,
      course: {
        id: entry.course.id,
        name: entry.course.name,
        code: entry.course.code,
        type: entry.course.type,
        semester: {
          id: entry.course.semester.id,
          number: entry.course.semester.number,
          program: {
            id: entry.course.semester.program.id,
            name: entry.course.semester.program.name,
            department: entry.course.semester.program.department ? {
              id: entry.course.semester.program.department.id,
              name: entry.course.semester.program.department.name,
              code: entry.course.semester.program.department.code ?? undefined
            } : undefined
          }
        },
        enrollments: entry.course.enrollments?.map(enrollment => ({
          id: enrollment.id,
          student: {
            id: enrollment.student.id,
            regId: enrollment.student.regId,
            regName: enrollment.student.regName
          }
        })) || []
      },
      faculty: {
        id: entry.faculty.id,
        name: entry.faculty.name
      },
      room: {
        id: entry.room.id,
        name: entry.room.name,
        type: entry.room.type,
        minCapacity: entry.room.minCapacity ?? undefined,
        maxCapacity: entry.room.maxCapacity ?? undefined,
        enhancement: entry.room.enhancement ? {
          capacity: entry.room.enhancement.capacity,
          optimalCapacity: entry.room.enhancement.optimalCapacity
        } : undefined
      },
      timeslot: {
        id: entry.timeslot.id,
        start: entry.timeslot.start,
        end: entry.timeslot.end
      }
    }))

    // Prepare filters for the export
    const filters = {
      programId: programId ? parseInt(programId) : undefined,
      semesterId: semesterId ? parseInt(semesterId) : undefined,
      facultyId: facultyId ? parseInt(facultyId) : undefined
    }

    // Export options
    const exportOptions = {
      format: format as 'detailed' | 'compact' | 'grid' | 'analytics',
      includeAnalytics: true,
      includeCharts: includeCharts,
      includeStudentList: false,
      colorScheme: colorScheme as 'professional' | 'vibrant' | 'minimal',
      language: 'en' as const
    }

    // Return the data for client-side PDF generation
    return NextResponse.json({
      success: true,
      message: 'Faculty workload data retrieved successfully',
      data: {
        entries: transformedEntries,
        totalEntries: transformedEntries.length,
        facultyCount: new Set(transformedEntries.map(e => e.faculty.name)).size,
        filters: filters,
        exportOptions: exportOptions
      }
    })

  } catch (error) {
    console.error('Error generating faculty workload report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate faculty workload report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/faculty-workload-report - Generate faculty workload PDF with custom data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      timetableData, 
      filters = {}, 
      options = {} 
    } = body

    if (!timetableData || !Array.isArray(timetableData) || timetableData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or empty timetable data provided'
        },
        { status: 400 }
      )
    }

    // Default export options
    const exportOptions = {
      format: 'detailed',
      includeAnalytics: true,
      includeCharts: true,
      includeStudentList: false,
      colorScheme: 'professional',
      language: 'en',
      ...options
    }

    // Return the data for client-side PDF generation
    return NextResponse.json({
      success: true,
      message: 'Faculty workload data processed successfully',
      data: {
        entries: timetableData,
        totalEntries: timetableData.length,
        facultyCount: new Set(timetableData.map((e: { faculty: { name: string } }) => e.faculty.name)).size,
        filters: filters,
        exportOptions: exportOptions
      }
    })

  } catch (error) {
    console.error('Error generating custom faculty workload report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate faculty workload report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}