import { NextRequest, NextResponse } from 'next/server'
import { preferenceScoringEngine } from '@/lib/preference-scoring'
import { prisma } from '@/lib/db'

// GET /api/preference-analysis - Get preference satisfaction analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')
    const includeDetails = searchParams.get('includeDetails') === 'true'

    if (facultyId) {
      // Get analysis for specific faculty
      const facultyIdNum = parseInt(facultyId)
      const score = await preferenceScoringEngine.calculateFacultyPreferenceSatisfaction(facultyIdNum)
      
      // Get faculty info
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyIdNum },
        include: {
          preferences: true,
          timetable: {
            include: {
              course: true,
              room: true,
              timeslot: true
            }
          }
        }
      })

      if (!faculty) {
        return NextResponse.json(
          { success: false, error: 'Faculty not found' },
          { status: 404 }
        )
      }

      const response: any = {
        success: true,
        data: {
          facultyId: faculty.id,
          facultyName: faculty.name,
          satisfactionScore: score,
          hasPreferences: !!faculty.preferences,
          currentScheduleCount: faculty.timetable.length
        }
      }

      if (includeDetails) {
        response.data.preferences = faculty.preferences
        response.data.currentSchedule = faculty.timetable
      }

      return NextResponse.json(response)
    } else {
      // Get overall analysis
      const overallAnalysis = await preferenceScoringEngine.calculateOverallPreferenceSatisfaction()
      
      // Get additional statistics
      const stats = await prisma.facultyPreference.aggregate({
        _count: { id: true }
      })
      
      const totalFaculty = await prisma.faculty.count()
      
      return NextResponse.json({
        success: true,
        data: {
          overall: overallAnalysis,
          statistics: {
            totalFaculty,
            facultyWithPreferences: stats._count.id,
            preferenceCoverage: totalFaculty > 0 ? (stats._count.id / totalFaculty) * 100 : 0
          }
        }
      })
    }
  } catch (error) {
    console.error('Error in preference analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze preferences' },
      { status: 500 }
    )
  }
}

// POST /api/preference-analysis/simulate - Simulate preference satisfaction for a proposed timetable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facultyId, proposedSchedule } = body

    if (!facultyId || !proposedSchedule) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID and proposed schedule are required' },
        { status: 400 }
      )
    }

    // Calculate satisfaction for proposed schedule
    const score = await preferenceScoringEngine.calculateFacultyPreferenceSatisfaction(
      facultyId,
      proposedSchedule
    )

    // Compare with current schedule
    const currentScore = await preferenceScoringEngine.calculateFacultyPreferenceSatisfaction(facultyId)
    
    const improvement = {
      overall: score.overall - currentScore.overall,
      timeSlot: score.timeSlotSatisfaction - currentScore.timeSlotSatisfaction,
      day: score.dayPreferenceSatisfaction - currentScore.dayPreferenceSatisfaction,
      workload: score.workloadSatisfaction - currentScore.workloadSatisfaction,
      room: score.roomPreferenceSatisfaction - currentScore.roomPreferenceSatisfaction
    }

    return NextResponse.json({
      success: true,
      data: {
        proposedScore: score,
        currentScore,
        improvement,
        recommendation: improvement.overall > 0.1 ? 'RECOMMENDED' : 
                      improvement.overall > 0 ? 'SLIGHT_IMPROVEMENT' : 
                      improvement.overall < -0.1 ? 'NOT_RECOMMENDED' : 'NEUTRAL'
      }
    })
  } catch (error) {
    console.error('Error in preference simulation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to simulate preference satisfaction' },
      { status: 500 }
    )
  }
}