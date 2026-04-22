import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/faculty-preferences/bulk - Bulk import/export faculty preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required (import/export)' },
        { status: 400 }
      )
    }

    if (action === 'export') {
      // Export all faculty preferences
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
        }
      })

      const exportData = preferences.map(pref => ({
        facultyId: pref.facultyId,
        facultyName: pref.faculty.name,
        facultyEmail: pref.faculty.email,
        department: pref.faculty.department,
        preferences: {
          preferredTimeSlots: pref.preferredTimeSlots,
          unavailableTimeSlots: pref.unavailableTimeSlots,
          preferredDays: pref.preferredDays,
          unavailableDays: pref.unavailableDays,
          maxDailyHours: pref.maxDailyHours,
          maxConsecutiveHours: pref.maxConsecutiveHours,
          preferredBreakDuration: pref.preferredBreakDuration,
          preferredTeachingPatterns: pref.preferredTeachingPatterns,
          avoidBackToBackClasses: pref.avoidBackToBackClasses,
          preferredRoomTypes: pref.preferredRoomTypes,
          preferredBuildings: pref.preferredBuildings,
          preferredCourseTypes: pref.preferredCourseTypes,
          maxCoursesPerDay: pref.maxCoursesPerDay,
          flexibilityLevel: pref.flexibilityLevel,
          priorityLevel: pref.priorityLevel
        }
      }))

      return NextResponse.json({
        success: true,
        data: exportData,
        message: `Exported preferences for ${exportData.length} faculty members`
      })
    }

    if (action === 'import') {
      if (!data || !Array.isArray(data)) {
        return NextResponse.json(
          { success: false, error: 'Import data must be an array' },
          { status: 400 }
        )
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const item of data) {
        try {
          const { facultyId, preferences } = item

          if (!facultyId || !preferences) {
            results.failed++
            results.errors.push(`Missing facultyId or preferences for item`)
            continue
          }

          // Verify faculty exists
          const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId }
          })

          if (!faculty) {
            results.failed++
            results.errors.push(`Faculty with ID ${facultyId} not found`)
            continue
          }

          // Import preferences
          await prisma.facultyPreference.upsert({
            where: { facultyId },
            update: {
              preferredTimeSlots: preferences.preferredTimeSlots || [],
              unavailableTimeSlots: preferences.unavailableTimeSlots || [],
              preferredDays: preferences.preferredDays || [],
              unavailableDays: preferences.unavailableDays || [],
              maxDailyHours: preferences.maxDailyHours || 8,
              maxConsecutiveHours: preferences.maxConsecutiveHours || 4,
              preferredBreakDuration: preferences.preferredBreakDuration || 30,
              preferredTeachingPatterns: preferences.preferredTeachingPatterns || [],
              avoidBackToBackClasses: preferences.avoidBackToBackClasses || false,
              preferredRoomTypes: preferences.preferredRoomTypes || [],
              preferredBuildings: preferences.preferredBuildings || [],
              preferredCourseTypes: preferences.preferredCourseTypes || [],
              maxCoursesPerDay: preferences.maxCoursesPerDay || 4,
              flexibilityLevel: preferences.flexibilityLevel || 'MODERATE',
              priorityLevel: preferences.priorityLevel || 'MEDIUM'
            },
            create: {
              facultyId,
              preferredTimeSlots: preferences.preferredTimeSlots || [],
              unavailableTimeSlots: preferences.unavailableTimeSlots || [],
              preferredDays: preferences.preferredDays || [],
              unavailableDays: preferences.unavailableDays || [],
              maxDailyHours: preferences.maxDailyHours || 8,
              maxConsecutiveHours: preferences.maxConsecutiveHours || 4,
              preferredBreakDuration: preferences.preferredBreakDuration || 30,
              preferredTeachingPatterns: preferences.preferredTeachingPatterns || [],
              avoidBackToBackClasses: preferences.avoidBackToBackClasses || false,
              preferredRoomTypes: preferences.preferredRoomTypes || [],
              preferredBuildings: preferences.preferredBuildings || [],
              preferredCourseTypes: preferences.preferredCourseTypes || [],
              maxCoursesPerDay: preferences.maxCoursesPerDay || 4,
              flexibilityLevel: preferences.flexibilityLevel || 'MODERATE',
              priorityLevel: preferences.priorityLevel || 'MEDIUM'
            }
          })

          results.successful++
        } catch (error) {
          results.failed++
          results.errors.push(`Error importing preferences for faculty ${item.facultyId}: ${error}`)
        }
      }

      return NextResponse.json({
        success: true,
        data: results,
        message: `Import completed: ${results.successful} successful, ${results.failed} failed`
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "import" or "export"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in bulk faculty preferences operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk operation' },
      { status: 500 }
    )
  }
}

// GET /api/faculty-preferences/bulk - Get bulk operation templates
export async function GET() {
  try {
    // Get all faculty for template generation
    const faculty = await prisma.faculty.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get available time slots for reference
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: {
        start: 'asc'
      }
    })

    const template = {
      faculty: faculty.map(f => ({
        facultyId: f.id,
        facultyName: f.name,
        facultyEmail: f.email,
        department: f.department,
        preferences: {
          preferredTimeSlots: [],
          unavailableTimeSlots: [],
          preferredDays: [],
          unavailableDays: [],
          maxDailyHours: 8,
          maxConsecutiveHours: 4,
          preferredBreakDuration: 30,
          preferredTeachingPatterns: [],
          avoidBackToBackClasses: false,
          preferredRoomTypes: [],
          preferredBuildings: [],
          preferredCourseTypes: [],
          maxCoursesPerDay: 4,
          flexibilityLevel: 'MODERATE',
          priorityLevel: 'MEDIUM'
        }
      })),
      reference: {
        timeSlots: timeSlots.map(ts => ({
          id: ts.id,
          start: ts.start,
          end: ts.end
        })),
        days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        roomTypes: ['CLASSROOM', 'LAB'],
        courseTypes: ['THEORY', 'LAB'],
        flexibilityLevels: ['STRICT', 'MODERATE', 'FLEXIBLE'],
        priorityLevels: ['HIGH', 'MEDIUM', 'LOW'],
        preferenceLevels: ['STRONGLY_PREFER', 'PREFER', 'NEUTRAL', 'AVOID', 'STRONGLY_AVOID']
      }
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Bulk import template generated successfully'
    })
  } catch (error) {
    console.error('Error generating bulk template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate bulk template' },
      { status: 500 }
    )
  }
}