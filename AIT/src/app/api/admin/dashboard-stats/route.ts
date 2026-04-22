import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Fetch comprehensive stats from database
    const results = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.faculty.count(),
      prisma.room.count(),
      prisma.department.count(),
      prisma.program.count(),
      prisma.timetable.count(),
      prisma.enrollment.count({ where: { isActive: true } }),
      prisma.timeSlot.count(),
      prisma.student.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        include: { program: true }
      }),
      prisma.course.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        include: { semester: { include: { program: true } } }
      }),
      prisma.room.groupBy({
        by: ['type'],
        _count: true
      })
    ])

    // Assign results
    const [
      students, 
      courses, 
      faculty, 
      rooms, 
      departments, 
      programs, 
      timetableEntries, 
      activeEnrollments, 
      timeSlots, 
      recentStudents, 
      recentCourses, 
      roomsByType
    ] = results

    // Get scheduled courses count
    const scheduledCourses = await prisma.course.count({
      where: {
        timetable: {
          some: {}
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        students,
        courses,
        faculty,
        rooms,
        departments,
        programs,
        timetableEntries,
        activeEnrollments,
        timeSlots,
        scheduledCourses,
        recentStudents,
        recentCourses,
        roomsByType
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}