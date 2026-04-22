import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/faculty-preferences - Get all faculty preferences or filter by facultyId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')

    if (facultyId) {
      // Get preferences for specific faculty
      const preferences = await prisma.facultyPreference.findUnique({
        where: { facultyId: parseInt(facultyId) },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          }
        }
      })

      if (!preferences) {
        return NextResponse.json(
          { success: false, error: 'Faculty preferences not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: preferences
      })
    } else {
      // Get all faculty preferences
      const preferences = await prisma.facultyPreference.findMany({
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          }
        },
        orderBy: {
          faculty: {
            name: 'asc'
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: preferences
      })
    }
  } catch (error) {
    console.error('Error fetching faculty preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty preferences' },
      { status: 500 }
    )
  }
}

// POST /api/faculty-preferences - Create or update faculty preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      facultyId,
      preferredTimeSlots,
      unavailableTimeSlots,
      preferredDays,
      unavailableDays,
      maxDailyHours,
      maxConsecutiveHours,
      preferredBreakDuration,
      preferredTeachingPatterns,
      avoidBackToBackClasses,
      preferredRoomTypes,
      preferredBuildings,
      preferredCourseTypes,
      maxCoursesPerDay,
      flexibilityLevel,
      priorityLevel
    } = body

    // Validate required fields
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      )
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    })

    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      )
    }

    // Validate preference data
    if (maxDailyHours && (maxDailyHours < 1 || maxDailyHours > 12)) {
      return NextResponse.json(
        { success: false, error: 'Max daily hours must be between 1 and 12' },
        { status: 400 }
      )
    }

    if (maxConsecutiveHours && (maxConsecutiveHours < 1 || maxConsecutiveHours > 8)) {
      return NextResponse.json(
        { success: false, error: 'Max consecutive hours must be between 1 and 8' },
        { status: 400 }
      )
    }

    // Create or update preferences
    const preferences = await prisma.facultyPreference.upsert({
      where: { facultyId },
      update: {
        preferredTimeSlots: preferredTimeSlots || [],
        unavailableTimeSlots: unavailableTimeSlots || [],
        preferredDays: preferredDays || [],
        unavailableDays: unavailableDays || [],
        maxDailyHours: maxDailyHours || 8,
        maxConsecutiveHours: maxConsecutiveHours || 4,
        preferredBreakDuration: preferredBreakDuration || 30,
        preferredTeachingPatterns: preferredTeachingPatterns || [],
        avoidBackToBackClasses: avoidBackToBackClasses || false,
        preferredRoomTypes: preferredRoomTypes || [],
        preferredBuildings: preferredBuildings || [],
        preferredCourseTypes: preferredCourseTypes || [],
        maxCoursesPerDay: maxCoursesPerDay || 4,
        flexibilityLevel: flexibilityLevel || 'MODERATE',
        priorityLevel: priorityLevel || 'MEDIUM'
      },
      create: {
        facultyId,
        preferredTimeSlots: preferredTimeSlots || [],
        unavailableTimeSlots: unavailableTimeSlots || [],
        preferredDays: preferredDays || [],
        unavailableDays: unavailableDays || [],
        maxDailyHours: maxDailyHours || 8,
        maxConsecutiveHours: maxConsecutiveHours || 4,
        preferredBreakDuration: preferredBreakDuration || 30,
        preferredTeachingPatterns: preferredTeachingPatterns || [],
        avoidBackToBackClasses: avoidBackToBackClasses || false,
        preferredRoomTypes: preferredRoomTypes || [],
        preferredBuildings: preferredBuildings || [],
        preferredCourseTypes: preferredCourseTypes || [],
        maxCoursesPerDay: maxCoursesPerDay || 4,
        flexibilityLevel: flexibilityLevel || 'MODERATE',
        priorityLevel: priorityLevel || 'MEDIUM'
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Faculty preferences saved successfully'
    })
  } catch (error) {
    console.error('Error saving faculty preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save faculty preferences' },
      { status: 500 }
    )
  }
}

// DELETE /api/faculty-preferences - Delete faculty preferences
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      )
    }

    // Check if preferences exist
    const existingPreferences = await prisma.facultyPreference.findUnique({
      where: { facultyId: parseInt(facultyId) }
    })

    if (!existingPreferences) {
      return NextResponse.json(
        { success: false, error: 'Faculty preferences not found' },
        { status: 404 }
      )
    }

    // Delete preferences
    await prisma.facultyPreference.delete({
      where: { facultyId: parseInt(facultyId) }
    })

    return NextResponse.json({
      success: true,
      message: 'Faculty preferences deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting faculty preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete faculty preferences' },
      { status: 500 }
    )
  }
}