import { NextRequest, NextResponse } from 'next/server'
import { TimetableGenerator } from '@/lib/timetable-algorithm'
import { EnhancedTimetableGenerator } from '@/lib/enhanced-timetable-algorithm'
import { StudentAwareTimetableGenerator } from '@/lib/student-aware-timetable-algorithm'
import { preferenceScoringEngine } from '@/lib/preference-scoring'

// POST /api/generate-timetable - Generate a new timetable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      useStudentAwareAlgorithm = true,
      useEnhancedAlgorithm = true,
      enablePreferences = true,
      preferenceWeight = 0.6,
      enableLoadBalancing = true,
      loadBalanceWeight = 0.4,
      enableRoomOptimization = true,
      roomOptimizationWeight = 0.3,
      enableStudentCapacityMatching = true,
      studentCapacityWeight = 0.8,
      capacityBufferPercentage = 10,
      prioritizeHighEnrollment = true,
      maxAttempts = 1000
    } = body

    let result
    let generator
    
    if (useStudentAwareAlgorithm) {
      // Use student-aware algorithm with enrollment and capacity optimization
      generator = new StudentAwareTimetableGenerator()
      
      const startTime = Date.now()
      result = await generator.generateTimetable({
        enablePreferences,
        preferenceWeight,
        enableLoadBalancing,
        loadBalanceWeight,
        enableRoomOptimization,
        roomOptimizationWeight,
        enableStudentCapacityMatching,
        studentCapacityWeight,
        capacityBufferPercentage,
        prioritizeHighEnrollment,
        maxAttempts
      })
      const generationTime = Date.now() - startTime
      
      if (result.success) {
        // Save the generated timetable
        const saveResult = await generator.saveTimetable(result.assignments!)
        
        if (!saveResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: saveResult.error || 'Failed to save student-aware timetable'
            },
            { status: 500 }
          )
        }

        // Calculate preference satisfaction scores
        const preferenceSatisfaction = await preferenceScoringEngine.calculateOverallPreferenceSatisfaction()
        
        return NextResponse.json({
          success: true,
          message: 'Student-aware timetable generated successfully with enrollment optimization',
          data: {
            assignmentsCount: result.assignments!.length,
            algorithm: 'student-aware',
            qualityScore: result.qualityScore,
            statistics: result.statistics,
            capacityAnalysis: result.capacityAnalysis,
            enrollmentSummary: result.enrollmentSummary,
            preferenceSatisfaction: {
              average: preferenceSatisfaction.averageSatisfaction,
              totalViolations: preferenceSatisfaction.totalViolations,
              facultyCount: preferenceSatisfaction.facultySatisfaction.length,
              details: preferenceSatisfaction.facultySatisfaction
            },
            performance: {
              generationTimeMs: generationTime,
              algorithmsUsed: ['student-aware', 'capacity-optimization', 'enrollment-matching', 'preference-optimization']
            },
            options: {
              enablePreferences,
              preferenceWeight,
              enableLoadBalancing,
              loadBalanceWeight,
              enableRoomOptimization,
              roomOptimizationWeight,
              enableStudentCapacityMatching,
              studentCapacityWeight,
              capacityBufferPercentage,
              prioritizeHighEnrollment
            }
          }
        })
      } else {
        // Fallback to enhanced algorithm if student-aware fails
        console.log('Student-aware algorithm failed, falling back to enhanced algorithm...')
        generator = new EnhancedTimetableGenerator()
        
        const fallbackStartTime = Date.now()
        const fallbackResult = await generator.generateTimetable({
          enablePreferences: false,
          preferenceWeight: 0,
          enableLoadBalancing: true,
          loadBalanceWeight: 0.5,
          enableRoomOptimization: true,
          roomOptimizationWeight: 0.3,
          maxAttempts: 500
        })
        const fallbackGenerationTime = Date.now() - fallbackStartTime
        
        if (fallbackResult.success) {
          const saveResult = await generator.saveTimetable(fallbackResult.assignments!)
          
          if (!saveResult.success) {
            return NextResponse.json(
              {
                success: false,
                error: saveResult.error || 'Failed to save fallback timetable'
              },
              { status: 500 }
            )
          }

          return NextResponse.json({
            success: true,
            message: 'Timetable generated successfully using fallback enhanced algorithm',
            data: {
              assignmentsCount: fallbackResult.assignments!.length,
              algorithm: 'enhanced-fallback',
              qualityScore: fallbackResult.qualityScore,
              statistics: fallbackResult.statistics,
              performance: {
                generationTimeMs: fallbackGenerationTime,
                algorithmsUsed: ['enhanced-fallback', 'load-balancing', 'room-optimization']
              },
              fallbackReason: result.error || 'Student-aware algorithm failed'
            }
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `Both student-aware and enhanced algorithms failed. Student-aware: ${result.error}. Enhanced: ${fallbackResult.error}`
            },
            { status: 400 }
          )
        }
      }
    } else if (useEnhancedAlgorithm) {
      // Use enhanced algorithm with preference support
      generator = new EnhancedTimetableGenerator()
      
      const startTime = Date.now()
      result = await generator.generateTimetable({
        enablePreferences,
        preferenceWeight,
        enableLoadBalancing,
        loadBalanceWeight,
        enableRoomOptimization,
        roomOptimizationWeight,
        maxAttempts
      })
      const generationTime = Date.now() - startTime
      
      if (result.success) {
        // Save the generated timetable
        const saveResult = await generator.saveTimetable(result.assignments!)
        
        if (!saveResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: saveResult.error || 'Failed to save enhanced timetable'
            },
            { status: 500 }
          )
        }

        // Calculate preference satisfaction scores
        const preferenceSatisfaction = await preferenceScoringEngine.calculateOverallPreferenceSatisfaction()
        
        return NextResponse.json({
          success: true,
          message: 'Enhanced timetable generated successfully with preference optimization',
          data: {
            assignmentsCount: result.assignments!.length,
            algorithm: 'enhanced',
            qualityScore: result.qualityScore,
            statistics: result.statistics,
            preferenceSatisfaction: {
              average: preferenceSatisfaction.averageSatisfaction,
              totalViolations: preferenceSatisfaction.totalViolations,
              facultyCount: preferenceSatisfaction.facultySatisfaction.length,
              details: preferenceSatisfaction.facultySatisfaction
            },
            performance: {
              generationTimeMs: generationTime,
              algorithmsUsed: ['enhanced', 'preference-optimization', 'load-balancing', 'room-optimization']
            },
            options: {
              enablePreferences,
              preferenceWeight,
              enableLoadBalancing,
              loadBalanceWeight,
              enableRoomOptimization,
              roomOptimizationWeight
            }
          }
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Enhanced timetable generation failed'
          },
          { status: 400 }
        )
      }
    } else {
      // Use basic algorithm as fallback
      generator = new TimetableGenerator()
      result = await generator.generateTimetable()
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to generate timetable'
          },
          { status: 400 }
        )
      }
      
      // Save the generated timetable to database
      const saveResult = await generator.saveTimetable(result.assignments!)
      
      if (!saveResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: saveResult.error || 'Failed to save timetable'
          },
          { status: 500 }
        )
      }
      
      // Get statistics about the generated timetable
      const statistics = generator.getStatistics(result.assignments!)
      
      return NextResponse.json({
        success: true,
        message: 'Basic timetable generated successfully',
        data: {
          assignmentsCount: result.assignments!.length,
          algorithm: 'basic',
          statistics
        }
      })
    }
  } catch (error) {
    console.error('Error in timetable generation API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during timetable generation'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/generate-timetable - Clear existing timetable
export async function DELETE() {
  try {
    const { prisma } = await import('@/lib/db')
    
    // Clear all timetable entries
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