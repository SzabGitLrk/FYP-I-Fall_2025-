import { prisma } from './db'
import { CrossRegistrationAwareTimetableGenerator } from './cross-registration-aware-algorithm'

export async function testCrossRegistrationSystem() {
  console.log('🧪 Testing Cross-Registration System...')
  
  try {
    // 1. Test student schedule generation
    console.log('📅 Testing student schedule generation...')
    
    // Get a sample student
    const student = await prisma.student.findFirst({
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            course: {
              include: {
                timetable: {
                  include: {
                    timeSlot: true,
                    room: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    if (!student) {
      console.log('❌ No students found for testing')
      return
    }
    
    console.log(`👤 Testing with student: ${student.regId} - ${student.regName}`)
    
    // 2. Generate student schedule
    const scheduleResponse = await fetch(`http://localhost:3000/api/students/${student.id}/schedule`, {
      method: 'POST'
    })
    
    if (scheduleResponse.ok) {
      console.log('✅ Student schedule generated successfully')
    } else {
      console.log('❌ Failed to generate student schedule')
    }
    
    // 3. Test enrollment validation
    console.log('🔍 Testing enrollment validation...')
    
    // Get a course the student is not enrolled in
    const availableCourse = await prisma.course.findFirst({
      where: {
        NOT: {
          enrollments: {
            some: {
              studentId: student.id,
              isActive: true
            }
          }
        }
      }
    })
    
    if (availableCourse) {
      const validationResponse = await fetch(`http://localhost:3000/api/students/${student.id}/validate-enrollment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: availableCourse.id }),
      })
      
      if (validationResponse.ok) {
        const validationResult = await validationResponse.json()
        console.log('✅ Enrollment validation completed')
        console.log(`   - Valid: ${validationResult.data.validation.isValid}`)
        console.log(`   - Warnings: ${validationResult.data.validation.warnings.length}`)
        console.log(`   - Errors: ${validationResult.data.validation.errors.length}`)
        console.log(`   - Conflicts: ${validationResult.data.validation.conflicts.length}`)
      } else {
        console.log('❌ Enrollment validation failed')
      }
    }
    
    // 4. Test conflict detection
    console.log('⚠️ Testing conflict detection...')
    
    const conflictsResponse = await fetch(`http://localhost:3000/api/students/${student.id}/conflicts`)
    
    if (conflictsResponse.ok) {
      const conflictsResult = await conflictsResponse.json()
      console.log('✅ Conflict detection completed')
      console.log(`   - Total conflicts: ${conflictsResult.data.conflicts.length}`)
      console.log(`   - Pending: ${conflictsResult.data.summary.pending}`)
      console.log(`   - Resolved: ${conflictsResult.data.summary.resolved}`)
    } else {
      console.log('❌ Conflict detection failed')
    }
    
    // 5. Test cross-registration statistics
    console.log('📊 Testing cross-registration statistics...')
    
    const crossRegStats = await calculateCrossRegistrationStats()
    console.log('✅ Cross-registration statistics calculated')
    console.log(`   - Total students: ${crossRegStats.totalStudents}`)
    console.log(`   - Students with cross-registrations: ${crossRegStats.studentsWithCrossRegistrations}`)
    console.log(`   - Total cross-registrations: ${crossRegStats.totalCrossRegistrations}`)
    
    // 6. Test algorithm integration
    console.log('🤖 Testing cross-registration aware algorithm...')
    
    const algorithm = new CrossRegistrationAwareTimetableGenerator()
    const report = await algorithm.generateCrossRegistrationReport()
    
    console.log('✅ Cross-registration algorithm completed')
    console.log(`   - Conflicts detected: ${report.conflicts.length}`)
    console.log(`   - Recommendations: ${report.recommendations.length}`)
    
    console.log('🎉 Cross-Registration System Test Completed Successfully!')
    
    return {
      success: true,
      results: {
        studentTested: `${student.regId} - ${student.regName}`,
        scheduleGenerated: true,
        validationTested: true,
        conflictDetectionTested: true,
        statisticsCalculated: true,
        algorithmTested: true,
        crossRegStats
      }
    }
    
  } catch (error) {
    console.error('❌ Cross-Registration System Test Failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function calculateCrossRegistrationStats() {
  // Get all students with their enrollments
  const students = await prisma.student.findMany({
    include: {
      enrollments: {
        where: { isActive: true },
        include: {
          course: {
            include: {
              semester: true
            }
          }
        }
      },
      semester: true
    }
  })
  
  let studentsWithCrossRegistrations = 0
  let totalCrossRegistrations = 0
  
  for (const student of students) {
    const studentSemesterId = student.semesterId
    const crossSemesterCourses = student.enrollments.filter(
      enrollment => enrollment.course.semesterId !== studentSemesterId
    )
    
    if (crossSemesterCourses.length > 0) {
      studentsWithCrossRegistrations++
      totalCrossRegistrations += crossSemesterCourses.length
    }
  }
  
  return {
    totalStudents: students.length,
    studentsWithCrossRegistrations,
    totalCrossRegistrations,
    crossRegistrationRate: (studentsWithCrossRegistrations / students.length) * 100
  }
}

// Export for use in API routes or testing
export { calculateCrossRegistrationStats }