import { prisma } from './db'
import { Day, CourseType, RoomType, ConflictType, ConflictSeverity } from '@prisma/client'

interface StudentEnrollmentData {
  studentId: number
  courseIds: number[]
  programId: number
  semesterId: number
  regId: string
  regName: string
}

interface CrossRegistrationConflict {
  studentId: number
  conflictingCourses: number[]
  timeSlot: {
    day: Day
    timeSlotId: number
    start: string
    end: string
  }
  severity: ConflictSeverity
  type: ConflictType
}

interface TimetableAssignment {
  courseId: number
  day: Day
  timeSlotId: number
  roomId: number
  facultyId: number
}

export class CrossRegistrationAwareTimetableGenerator {
  private studentEnrollments: Map<number, StudentEnrollmentData> = new Map()
  private crossRegistrations: Map<number, number[]> = new Map() // studentId -> courseIds from other semesters
  private detectedConflicts: CrossRegistrationConflict[] = []

  async generateTimetableWithCrossRegistrationSupport(): Promise<{
    success: boolean
    assignments?: TimetableAssignment[]
    studentConflicts?: CrossRegistrationConflict[]
    crossRegistrationStats?: any
    error?: string
  }> {
    try {
      // Load student enrollment data
      await this.loadStudentEnrollmentData()
      
      // Identify cross-registrations
      this.identifyCrossRegistrations()
      
      // Generate base timetable
      const baseResult = await this.generateBaseTimetable()
      
      if (!baseResult.success) {
        return baseResult
      }
      
      // Detect and resolve cross-registration conflicts
      await this.detectCrossRegistrationConflicts(baseResult.assignments!)
      
      // Generate individual student schedules
      await this.generateStudentSchedules(baseResult.assignments!)
      
      // Calculate cross-registration statistics
      const crossRegStats = this.calculateCrossRegistrationStatistics()
      
      return {
        success: true,
        assignments: baseResult.assignments,
        studentConflicts: this.detectedConflicts,
        crossRegistrationStats: crossRegStats
      }
      
    } catch (error) {
      console.error('Error in cross-registration aware timetable generation:', error)
      return {
        success: false,
        error: 'Failed to generate cross-registration aware timetable'
      }
    }
  }

  private async loadStudentEnrollmentData(): Promise<void> {
    // Get all active enrollments with student and course details
    const enrollments = await prisma.enrollment.findMany({
      where: {
        isActive: true
      },
      include: {
        student: {
          include: {
            program: true,
            semester: true
          }
        },
        course: {
          include: {
            semester: true
          }
        }
      }
    })

    // Group enrollments by student
    const studentEnrollmentMap = new Map<number, StudentEnrollmentData>()
    
    for (const enrollment of enrollments) {
      const studentId = enrollment.studentId
      
      if (!studentEnrollmentMap.has(studentId)) {
        studentEnrollmentMap.set(studentId, {
          studentId: studentId,
          courseIds: [],
          programId: enrollment.student.programId || 0,
          semesterId: enrollment.student.semesterId || 0,
          regId: enrollment.student.regId,
          regName: enrollment.student.regName
        })
      }
      
      const studentData = studentEnrollmentMap.get(studentId)!
      studentData.courseIds.push(enrollment.courseId)
    }
    
    this.studentEnrollments = studentEnrollmentMap
  }

  private identifyCrossRegistrations(): void {
    for (const [studentId, studentData] of this.studentEnrollments) {
      const crossRegCourses: number[] = []
      
      // Check each course enrollment
      for (const courseId of studentData.courseIds) {
        // Find course details (we'll need to query this)
        // For now, we'll identify cross-registrations in the conflict detection phase
      }
      
      if (crossRegCourses.length > 0) {
        this.crossRegistrations.set(studentId, crossRegCourses)
      }
    }
  }

  private async generateBaseTimetable(): Promise<{
    success: boolean
    assignments?: TimetableAssignment[]
    error?: string
  }> {
    try {
      // Use existing timetable generation logic
      // This would integrate with the existing StudentAwareTimetableGenerator
      
      // For now, get existing timetable
      const existingTimetable = await prisma.timetable.findMany({
        include: {
          course: true,
          faculty: true,
          room: true,
          timeslot: true
        }
      })
      
      const assignments: TimetableAssignment[] = existingTimetable.map(entry => ({
        courseId: entry.courseId,
        day: entry.day,
        timeSlotId: entry.timeSlotId,
        roomId: entry.roomId,
        facultyId: entry.facultyId
      }))
      
      return {
        success: true,
        assignments
      }
      
    } catch (error) {
      console.error('Error generating base timetable:', error)
      return {
        success: false,
        error: 'Failed to generate base timetable'
      }
    }
  }

  private async detectCrossRegistrationConflicts(assignments: TimetableAssignment[]): Promise<void> {
    // Create a map of course schedules
    const courseScheduleMap = new Map<number, Array<{
      day: Day
      timeSlotId: number
      roomId: number
    }>>()
    
    for (const assignment of assignments) {
      if (!courseScheduleMap.has(assignment.courseId)) {
        courseScheduleMap.set(assignment.courseId, [])
      }
      
      courseScheduleMap.get(assignment.courseId)!.push({
        day: assignment.day,
        timeSlotId: assignment.timeSlotId,
        roomId: assignment.roomId
      })
    }
    
    // Get time slot details
    const timeSlots = await prisma.timeSlot.findMany()
    const timeSlotMap = new Map(timeSlots.map(ts => [ts.id, ts]))
    
    // Check each student's schedule for conflicts
    for (const [studentId, studentData] of this.studentEnrollments) {
      const studentSchedule = new Map<string, {
        courseId: number
        day: Day
        timeSlotId: number
        roomId: number
      }>()
      
      // Build student's complete schedule
      for (const courseId of studentData.courseIds) {
        const courseSchedules = courseScheduleMap.get(courseId) || []
        
        for (const schedule of courseSchedules) {
          const timeKey = `${schedule.day}-${schedule.timeSlotId}`
          
          if (studentSchedule.has(timeKey)) {
            // Conflict detected!
            const existingEntry = studentSchedule.get(timeKey)!
            const timeSlot = timeSlotMap.get(schedule.timeSlotId)
            
            const conflict: CrossRegistrationConflict = {
              studentId: studentId,
              conflictingCourses: [existingEntry.courseId, courseId],
              timeSlot: {
                day: schedule.day,
                timeSlotId: schedule.timeSlotId,
                start: timeSlot?.start || '',
                end: timeSlot?.end || ''
              },
              severity: 'HIGH',
              type: 'SCHEDULING_CONFLICT'
            }
            
            this.detectedConflicts.push(conflict)
          } else {
            studentSchedule.set(timeKey, {
              courseId: courseId,
              day: schedule.day,
              timeSlotId: schedule.timeSlotId,
              roomId: schedule.roomId
            })
          }
        }
      }
    }
  }

  private async generateStudentSchedules(assignments: TimetableAssignment[]): Promise<void> {
    // Clear existing student schedules
    await prisma.studentSchedule.deleteMany()
    
    // Create schedule entries for each student
    const scheduleEntries: Array<{
      studentId: number
      courseId: number
      day: Day
      timeSlotId: number
      roomId: number
      semesterId: number
      isActive: boolean
      isConflict: boolean
      conflictReason?: string
    }> = []
    
    // Get course semester information
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        semesterId: true
      }
    })
    const courseSemesterMap = new Map(courses.map(c => [c.id, c.semesterId]))
    
    for (const [studentId, studentData] of this.studentEnrollments) {
      for (const courseId of studentData.courseIds) {
        const courseAssignments = assignments.filter(a => a.courseId === courseId)
        
        for (const assignment of courseAssignments) {
          // Check if this creates a conflict for the student
          const hasConflict = this.detectedConflicts.some(conflict =>
            conflict.studentId === studentId &&
            conflict.conflictingCourses.includes(courseId) &&
            conflict.timeSlot.day === assignment.day &&
            conflict.timeSlot.timeSlotId === assignment.timeSlotId
          )
          
          scheduleEntries.push({
            studentId: studentId,
            courseId: courseId,
            day: assignment.day,
            timeSlotId: assignment.timeSlotId,
            roomId: assignment.roomId,
            semesterId: courseSemesterMap.get(courseId) || studentData.semesterId,
            isActive: true,
            isConflict: hasConflict,
            conflictReason: hasConflict ? 'Cross-registration schedule conflict detected' : undefined
          })
        }
      }
    }
    
    // Batch create schedule entries
    if (scheduleEntries.length > 0) {
      await prisma.studentSchedule.createMany({
        data: scheduleEntries
      })
    }
    
    // Create conflict records in database
    await this.saveConflictRecords()
  }

  private async saveConflictRecords(): Promise<void> {
    if (this.detectedConflicts.length === 0) return
    
    // Get course details for conflict descriptions
    const courseIds = [...new Set(this.detectedConflicts.flatMap(c => c.conflictingCourses))]
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds }
      },
      select: {
        id: true,
        name: true,
        code: true
      }
    })
    const courseMap = new Map(courses.map(c => [c.id, c]))
    
    const conflictRecords = this.detectedConflicts.map(conflict => {
      const conflictingCourseDetails = conflict.conflictingCourses.map(courseId => {
        const course = courseMap.get(courseId)
        return {
          id: courseId,
          name: course?.name || 'Unknown Course',
          code: course?.code || 'N/A'
        }
      })
      
      return {
        studentId: conflict.studentId,
        conflictType: conflict.type,
        severity: conflict.severity,
        title: `Schedule Conflict on ${conflict.timeSlot.day}`,
        description: `Student has overlapping courses on ${conflict.timeSlot.day} at ${conflict.timeSlot.start}-${conflict.timeSlot.end}`,
        affectedCourses: conflictingCourseDetails,
        timeSlotInfo: conflict.timeSlot,
        resolutionSuggestions: [
          'Drop one of the conflicting courses',
          'Request course rescheduling',
          'Consult with academic advisor'
        ]
      }
    })
    
    await prisma.studentConflict.createMany({
      data: conflictRecords
    })
  }

  private calculateCrossRegistrationStatistics(): any {
    const stats = {
      totalStudents: this.studentEnrollments.size,
      studentsWithCrossRegistrations: 0,
      totalCrossRegistrations: 0,
      conflictsDetected: this.detectedConflicts.length,
      studentsWithConflicts: new Set(this.detectedConflicts.map(c => c.studentId)).size,
      conflictsBySeverity: {
        CRITICAL: this.detectedConflicts.filter(c => c.severity === 'CRITICAL').length,
        HIGH: this.detectedConflicts.filter(c => c.severity === 'HIGH').length,
        MEDIUM: this.detectedConflicts.filter(c => c.severity === 'MEDIUM').length,
        LOW: this.detectedConflicts.filter(c => c.severity === 'LOW').length
      },
      crossRegistrationsByProgram: new Map<string, number>(),
      crossRegistrationsBySemester: new Map<number, number>()
    }
    
    // Calculate cross-registration statistics
    for (const [studentId, studentData] of this.studentEnrollments) {
      const crossRegCourses = this.crossRegistrations.get(studentId) || []
      if (crossRegCourses.length > 0) {
        stats.studentsWithCrossRegistrations++
        stats.totalCrossRegistrations += crossRegCourses.length
      }
    }
    
    return stats
  }

  // Public method to get cross-registration report
  async generateCrossRegistrationReport(): Promise<{
    summary: any
    conflicts: CrossRegistrationConflict[]
    recommendations: string[]
  }> {
    const summary = this.calculateCrossRegistrationStatistics()
    
    const recommendations = []
    
    if (this.detectedConflicts.length > 0) {
      recommendations.push(`${this.detectedConflicts.length} schedule conflicts detected and require resolution`)
    }
    
    if (summary.studentsWithCrossRegistrations > 0) {
      recommendations.push(`${summary.studentsWithCrossRegistrations} students have cross-semester enrollments`)
    }
    
    if (summary.conflictsDetected === 0 && summary.studentsWithCrossRegistrations > 0) {
      recommendations.push('Cross-registrations are working well with no conflicts detected')
    }
    
    return {
      summary,
      conflicts: this.detectedConflicts,
      recommendations
    }
  }
}