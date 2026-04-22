import { prisma } from './db'
import { Day, CourseType, RoomType, FlexibilityLevel, PriorityLevel, PreferenceLevel } from '@prisma/client'
import { PreferenceUtils } from '@/types/faculty-preferences'

interface Course {
  id: number
  name: string
  code: string
  type: CourseType
  semester: {
    id: number
    number: number
    program: {
      id: number
      name: string
    }
  }
  faculty: {
    id: number
    name: string
  } | null
  enrollments: Array<{
    id: number
    student: {
      id: number
      regId: string
      regName: string
    }
    isActive: boolean
  }>
  enhancement?: {
    expectedEnrollment: number
    maxEnrollment: number
    minEnrollment: number
    requiredEquipment: any[]
    preferredTimeSlots: any[]
    avoidTimeSlots: any[]
  }
}

interface Room {
  id: number
  name: string
  type: RoomType
  minCapacity?: number
  maxCapacity?: number
  enhancement?: {
    capacity: number
    optimalCapacity: number
    equipment: any[]
    suitableForCourseTypes: string[]
    departmentPreferences: string[]
  }
}

interface TimeSlot {
  id: number
  start: string
  end: string
}

interface FacultyPreference {
  facultyId: number
  preferredTimeSlots: Array<{
    timeSlotId: number
    dayOfWeek: string
    preference: PreferenceLevel
  }>
  unavailableTimeSlots: Array<{
    timeSlotId: number
    dayOfWeek: string
  }>
  preferredDays: string[]
  unavailableDays: string[]
  maxDailyHours: number
  maxConsecutiveHours: number
  avoidBackToBackClasses: boolean
  flexibilityLevel: FlexibilityLevel
  priorityLevel: PriorityLevel
}

interface TimetableEntry {
  courseId: number
  day: Day
  timeSlotId: number
  roomId: number
  facultyId: number
}

interface StudentAwareAssignment extends TimetableEntry {
  score: number
  violations: string[]
  enrollmentCount: number
  roomCapacityMatch: number // 0-1 score for how well room capacity matches enrollment
  capacityUtilization: number // Percentage of room capacity used
}

interface GenerationOptions {
  maxAttempts?: number
  preferenceWeight?: number
  loadBalanceWeight?: number
  roomOptimizationWeight?: number
  studentCapacityWeight?: number // New: Weight for student-capacity matching
  enablePreferences?: boolean
  enableLoadBalancing?: boolean
  enableRoomOptimization?: boolean
  enableStudentCapacityMatching?: boolean // New: Enable student-aware scheduling
  capacityBufferPercentage?: number // New: Buffer for room capacity (default 10%)
  prioritizeHighEnrollment?: boolean // New: Prioritize courses with more students
}

interface CapacityAnalysis {
  enrollmentCount: number
  roomCapacity: number
  utilizationPercentage: number
  capacityMatch: 'PERFECT' | 'GOOD' | 'ACCEPTABLE' | 'OVERCROWDED' | 'UNDERUTILIZED'
  recommendedRoomSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'AUDITORIUM'
}

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as Day[]

export class StudentAwareTimetableGenerator {
  private courses: Course[] = []
  private rooms: Room[] = []
  private timeSlots: TimeSlot[] = []
  private facultyPreferences: Map<number, FacultyPreference> = new Map()
  private assignments: StudentAwareAssignment[] = []
  private enrollmentData: Map<number, number> = new Map() // courseId -> enrollment count
  private capacityAnalysis: Map<number, CapacityAnalysis> = new Map() // courseId -> analysis
  private options: GenerationOptions = {
    maxAttempts: 1000, // Reduced attempts for faster testing
    preferenceWeight: 0.3, // Reduced preference weight
    loadBalanceWeight: 0.2, // Reduced load balance weight
    roomOptimizationWeight: 0.2, // Reduced room optimization weight
    studentCapacityWeight: 0.4, // Reduced student capacity weight
    enablePreferences: false, // Disable preferences for now
    enableLoadBalancing: true,
    enableRoomOptimization: true,
    enableStudentCapacityMatching: true,
    capacityBufferPercentage: 20, // Increased buffer
    prioritizeHighEnrollment: false // Disable high enrollment priority
  }

  async generateTimetable(options?: Partial<GenerationOptions>): Promise<{
    success: boolean
    assignments?: TimetableEntry[]
    statistics?: any
    qualityScore?: number
    capacityAnalysis?: any
    enrollmentSummary?: any
    error?: string
  }> {
    try {
      // Merge options
      this.options = { ...this.options, ...options }

      // Load all necessary data including student enrollments
      await this.loadDataWithEnrollments()
      
      // Analyze enrollment and capacity data
      this.analyzeEnrollmentCapacity()
      
      // Validate prerequisites
      const validation = this.validatePrerequisites()
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Clear existing assignments
      this.assignments = []

      // Generate student-aware timetable
      const result = await this.generateStudentAwareTimetable()
      
      if (result.success) {
        const statistics = this.calculateStatistics()
        const qualityScore = this.calculateQualityScore()
        const capacityAnalysis = this.getCapacityAnalysisSummary()
        const enrollmentSummary = this.getEnrollmentSummary()
        
        return { 
          success: true, 
          assignments: this.assignments.map(a => ({
            courseId: a.courseId,
            day: a.day,
            timeSlotId: a.timeSlotId,
            roomId: a.roomId,
            facultyId: a.facultyId
          })),
          statistics,
          qualityScore,
          capacityAnalysis,
          enrollmentSummary
        }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error in student-aware timetable generation:', error)
      return { success: false, error: 'An unexpected error occurred during timetable generation' }
    }
  }

  private async loadDataWithEnrollments(): Promise<void> {
    // Load courses with enrollments and enhancements
    this.courses = await prisma.course.findMany({
      include: {
        semester: {
          include: {
            program: true
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
      },
      where: {
        faculty: {
          isNot: null
        }
      }
    }) as Course[]

    // Load rooms with capacity information
    this.rooms = await prisma.room.findMany({
      include: {
        enhancement: true
      }
    }) as Room[]

    // Load time slots
    this.timeSlots = await prisma.timeSlot.findMany({
      orderBy: { start: 'asc' }
    })

    // Load faculty preferences if enabled
    if (this.options.enablePreferences) {
      const preferences = await prisma.facultyPreference.findMany()
      preferences.forEach(pref => {
        this.facultyPreferences.set(pref.facultyId, {
          facultyId: pref.facultyId,
          preferredTimeSlots: pref.preferredTimeSlots as any[],
          unavailableTimeSlots: pref.unavailableTimeSlots as any[],
          preferredDays: pref.preferredDays as string[],
          unavailableDays: pref.unavailableDays as string[],
          maxDailyHours: pref.maxDailyHours,
          maxConsecutiveHours: pref.maxConsecutiveHours,
          avoidBackToBackClasses: pref.avoidBackToBackClasses,
          flexibilityLevel: pref.flexibilityLevel as FlexibilityLevel,
          priorityLevel: pref.priorityLevel as PriorityLevel
        })
      })
    }

    // Build enrollment data map
    this.courses.forEach(course => {
      const activeEnrollments = course.enrollments.filter(e => e.isActive)
      this.enrollmentData.set(course.id, activeEnrollments.length)
    })
  }

  private analyzeEnrollmentCapacity(): void {
    this.courses.forEach(course => {
      const enrollmentCount = this.enrollmentData.get(course.id) || 0
      
      // Find best room capacity for this course
      const suitableRooms = this.getAvailableRooms(course)
      const roomCapacities = suitableRooms.map(room => this.getRoomCapacity(room))
      
      if (roomCapacities.length === 0) {
        return
      }

      // Find optimal room capacity
      const optimalCapacity = this.findOptimalRoomCapacity(enrollmentCount, roomCapacities)
      const utilizationPercentage = enrollmentCount > 0 ? (enrollmentCount / optimalCapacity) * 100 : 0

      // Determine capacity match quality
      let capacityMatch: CapacityAnalysis['capacityMatch'] = 'ACCEPTABLE'
      if (utilizationPercentage >= 80 && utilizationPercentage <= 100) {
        capacityMatch = 'PERFECT'
      } else if (utilizationPercentage >= 60 && utilizationPercentage < 80) {
        capacityMatch = 'GOOD'
      } else if (utilizationPercentage > 100) {
        capacityMatch = 'OVERCROWDED'
      } else if (utilizationPercentage < 40) {
        capacityMatch = 'UNDERUTILIZED'
      }

      // Recommend room size category
      let recommendedRoomSize: CapacityAnalysis['recommendedRoomSize'] = 'MEDIUM'
      if (enrollmentCount <= 20) {
        recommendedRoomSize = 'SMALL'
      } else if (enrollmentCount <= 50) {
        recommendedRoomSize = 'MEDIUM'
      } else if (enrollmentCount <= 80) {
        recommendedRoomSize = 'LARGE'
      } else {
        recommendedRoomSize = 'AUDITORIUM'
      }

      this.capacityAnalysis.set(course.id, {
        enrollmentCount,
        roomCapacity: optimalCapacity,
        utilizationPercentage,
        capacityMatch,
        recommendedRoomSize
      })
    })
  }

  private findOptimalRoomCapacity(enrollmentCount: number, availableCapacities: number[]): number {
    if (availableCapacities.length === 0) return 50 // Default fallback

    // Sort capacities
    const sortedCapacities = [...availableCapacities].sort((a, b) => a - b)
    
    // Find the smallest room that can accommodate the enrollment with buffer
    const requiredCapacity = enrollmentCount * (1 + (this.options.capacityBufferPercentage! / 100))
    
    const suitableRoom = sortedCapacities.find(capacity => capacity >= requiredCapacity)
    
    // If no room is large enough, return the largest available
    return suitableRoom || sortedCapacities[sortedCapacities.length - 1]
  }

  private getRoomCapacity(room: Room): number {
    // Priority: maxCapacity > enhancement.capacity > minCapacity > default
    if (room.maxCapacity) return room.maxCapacity
    if (room.enhancement?.capacity) return room.enhancement.capacity
    if (room.minCapacity) return room.minCapacity
    
    // Default capacities based on room type
    return room.type === RoomType.LAB ? 25 : 50
  }

  private validatePrerequisites(): { valid: boolean; error?: string } {
    if (this.courses.length === 0) {
      return { valid: false, error: 'No courses with assigned faculty found.' }
    }

    if (this.rooms.length === 0) {
      return { valid: false, error: 'No rooms found.' }
    }

    if (this.timeSlots.length === 0) {
      return { valid: false, error: 'No time slots found.' }
    }

    // Check for capacity mismatches
    const overcrowdedCourses = Array.from(this.capacityAnalysis.entries())
      .filter(([_, analysis]) => analysis.capacityMatch === 'OVERCROWDED')
    
    if (overcrowdedCourses.length > 0) {
      const courseNames = overcrowdedCourses.map(([courseId, _]) => {
        const course = this.courses.find(c => c.id === courseId)
        return course?.name || `Course ${courseId}`
      }).join(', ')
      
      console.warn(`Warning: Overcrowded courses detected: ${courseNames}`)
      // Don't fail validation, but log warning
    }

    return { valid: true }
  }

  private async generateStudentAwareTimetable(): Promise<{ success: boolean; error?: string }> {
    let bestSolution: StudentAwareAssignment[] = []
    let bestScore = -1
    let attempts = 0

    while (attempts < this.options.maxAttempts!) {
      this.assignments = []
      
      // Sort courses by priority considering enrollments
      const sortedCourses = this.prioritizeCoursesWithEnrollments()
      
      // Try to assign all courses
      let allAssigned = true
      for (const course of sortedCourses) {
        const assignment = this.findOptimalStudentAwareAssignment(course)
        if (assignment) {
          this.assignments.push(assignment)
        } else {
          allAssigned = false
          break
        }
      }
      
      if (allAssigned) {
        const score = this.calculateQualityScore()
        if (score > bestScore) {
          bestScore = score
          bestSolution = [...this.assignments]
        }
        
        // If we found a very good solution, we can stop early
        if (score > 0.92) {
          break
        }
      }
      
      attempts++
      
      // Add randomization to explore different solutions
      if (attempts % 300 === 0) {
        this.shuffleArray(sortedCourses)
      }
    }
    
    if (bestSolution.length > 0) {
      this.assignments = bestSolution
      return { success: true }
    }
    
    return { 
      success: false, 
      error: `Could not generate a valid student-aware timetable after ${this.options.maxAttempts} attempts.` 
    }
  }

  private prioritizeCoursesWithEnrollments(): Course[] {
    return [...this.courses].sort((a, b) => {
      // Lab courses first (more constraints)
      if (a.type === CourseType.LAB && b.type === CourseType.THEORY) return -1
      if (a.type === CourseType.THEORY && b.type === CourseType.LAB) return 1
      
      // Prioritize high enrollment courses if enabled
      if (this.options.prioritizeHighEnrollment) {
        const aEnrollment = this.enrollmentData.get(a.id) || 0
        const bEnrollment = this.enrollmentData.get(b.id) || 0
        if (aEnrollment !== bEnrollment) {
          return bEnrollment - aEnrollment // Higher enrollment first
        }
      }
      
      // Consider faculty priority levels
      const aPrefs = this.facultyPreferences.get(a.faculty!.id)
      const bPrefs = this.facultyPreferences.get(b.faculty!.id)
      
      if (aPrefs && bPrefs) {
        const aPriority = PreferenceUtils.getPriorityWeight(aPrefs.priorityLevel)
        const bPriority = PreferenceUtils.getPriorityWeight(bPrefs.priorityLevel)
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
      }
      
      // Courses with capacity issues first
      const aAnalysis = this.capacityAnalysis.get(a.id)
      const bAnalysis = this.capacityAnalysis.get(b.id)
      
      if (aAnalysis && bAnalysis) {
        const aIssue = aAnalysis.capacityMatch === 'OVERCROWDED' ? 1 : 0
        const bIssue = bAnalysis.capacityMatch === 'OVERCROWDED' ? 1 : 0
        if (aIssue !== bIssue) {
          return bIssue - aIssue // Issues first
        }
      }
      
      // Higher semesters first
      if (a.semester.number !== b.semester.number) {
        return b.semester.number - a.semester.number
      }
      
      return a.name.localeCompare(b.name)
    })
  }

  private findOptimalStudentAwareAssignment(course: Course): StudentAwareAssignment | null {
    const candidates: StudentAwareAssignment[] = []
    const enrollmentCount = this.enrollmentData.get(course.id) || 0
    
    // Generate all possible assignments
    for (const day of DAYS) {
      for (const timeSlot of this.timeSlots) {
        for (const room of this.getAvailableRooms(course)) {
          const assignment: StudentAwareAssignment = {
            courseId: course.id,
            day: day,
            timeSlotId: timeSlot.id,
            roomId: room.id,
            facultyId: course.faculty!.id,
            score: 0,
            violations: [],
            enrollmentCount,
            roomCapacityMatch: 0,
            capacityUtilization: 0
          }

          // Check hard constraints
          if (this.hasHardConstraintViolations(assignment)) {
            continue
          }

          // Calculate capacity metrics
          this.calculateCapacityMetrics(assignment, course, room)

          // Calculate quality score
          assignment.score = this.calculateStudentAwareAssignmentScore(assignment, course, room)
          candidates.push(assignment)
        }
      }
    }

    // Return the best candidate
    if (candidates.length === 0) {
      return null
    }

    return candidates.reduce((best, current) => 
      current.score > best.score ? current : best
    )
  }

  private calculateCapacityMetrics(assignment: StudentAwareAssignment, course: Course, room: Room): void {
    const enrollmentCount = assignment.enrollmentCount
    const roomCapacity = this.getRoomCapacity(room)
    
    assignment.capacityUtilization = enrollmentCount > 0 ? (enrollmentCount / roomCapacity) * 100 : 0
    
    // Calculate capacity match score (0-1)
    if (assignment.capacityUtilization >= 80 && assignment.capacityUtilization <= 100) {
      assignment.roomCapacityMatch = 1.0 // Perfect match
    } else if (assignment.capacityUtilization >= 60 && assignment.capacityUtilization < 80) {
      assignment.roomCapacityMatch = 0.8 // Good match
    } else if (assignment.capacityUtilization >= 40 && assignment.capacityUtilization < 60) {
      assignment.roomCapacityMatch = 0.6 // Acceptable match
    } else if (assignment.capacityUtilization > 100) {
      assignment.roomCapacityMatch = 0.2 // Overcrowded
    } else {
      assignment.roomCapacityMatch = 0.4 // Underutilized
    }
  }

  private getAvailableRooms(course: Course): Room[] {
    let availableRooms = this.rooms

    // Filter by course type
    if (course.type === CourseType.LAB) {
      availableRooms = availableRooms.filter(room => room.type === RoomType.LAB)
    } else {
      availableRooms = availableRooms.filter(room => room.type === RoomType.CLASSROOM)
    }

    // Filter by enrollment capacity if student capacity matching is enabled
    if (this.options.enableStudentCapacityMatching) {
      const enrollmentCount = this.enrollmentData.get(course.id) || 0
      const requiredCapacity = enrollmentCount * (1 + (this.options.capacityBufferPercentage! / 100))
      
      // Filter out rooms that are too small
      availableRooms = availableRooms.filter(room => {
        const roomCapacity = this.getRoomCapacity(room)
        return roomCapacity >= enrollmentCount // Must accommodate all students
      })
      
      // Sort by capacity efficiency (prefer rooms that are not too large)
      availableRooms.sort((a, b) => {
        const aCapacity = this.getRoomCapacity(a)
        const bCapacity = this.getRoomCapacity(b)
        const aWaste = Math.max(0, aCapacity - requiredCapacity)
        const bWaste = Math.max(0, bCapacity - requiredCapacity)
        return aWaste - bWaste // Prefer less waste
      })
    }

    // Filter by room suitability if enhancement data exists
    if (this.options.enableRoomOptimization) {
      availableRooms = availableRooms.filter(room => {
        if (!room.enhancement) return true
        
        const suitableTypes = room.enhancement.suitableForCourseTypes
        if (suitableTypes && suitableTypes.length > 0) {
          return suitableTypes.includes(course.type)
        }
        
        return true
      })
    }

    return availableRooms
  }

  private hasHardConstraintViolations(assignment: StudentAwareAssignment): boolean {
    for (const existing of this.assignments) {
      if (existing.day !== assignment.day || existing.timeSlotId !== assignment.timeSlotId) {
        continue
      }

      // Room conflict - same room cannot be used twice at the same time
      if (existing.roomId === assignment.roomId) {
        return true
      }

      // Faculty conflict - same faculty cannot teach two courses at the same time
      if (existing.facultyId === assignment.facultyId) {
        return true
      }

      // Student conflict - check if students are enrolled in both courses
      // This is more complex and would require checking actual student enrollments
      // For now, we'll allow courses from the same semester to run simultaneously
      // as students typically don't take all courses in a semester at once
      
      // NOTE: Removed the semester conflict check that was preventing
      // multiple courses from the same semester from running simultaneously
    }

    // Check faculty unavailability (hard constraint)
    const preferences = this.facultyPreferences.get(assignment.facultyId)
    if (preferences) {
      const isUnavailable = preferences.unavailableTimeSlots.some(slot =>
        slot.timeSlotId === assignment.timeSlotId &&
        (slot.dayOfWeek === assignment.day || slot.dayOfWeek === 'ANY')
      )
      
      if (isUnavailable || preferences.unavailableDays.includes(assignment.day)) {
        return true
      }
    }

    return false
  }

  private calculateStudentAwareAssignmentScore(
    assignment: StudentAwareAssignment, 
    course: Course, 
    room: Room
  ): number {
    let score = 1.0
    const violations: string[] = []

    // Student capacity matching score (high weight)
    if (this.options.enableStudentCapacityMatching) {
      const capacityScore = assignment.roomCapacityMatch
      score *= (1 - this.options.studentCapacityWeight!) + (this.options.studentCapacityWeight! * capacityScore)
      
      if (capacityScore < 0.6) {
        violations.push(`Poor capacity match: ${assignment.capacityUtilization.toFixed(1)}% utilization`)
      }
    }

    // Faculty preference score
    if (this.options.enablePreferences) {
      const prefScore = this.calculatePreferenceScore(assignment, violations)
      score *= (1 - this.options.preferenceWeight!) + (this.options.preferenceWeight! * prefScore)
    }

    // Load balancing score
    if (this.options.enableLoadBalancing) {
      const loadScore = this.calculateLoadBalanceScore(assignment, violations)
      score *= (1 - this.options.loadBalanceWeight!) + (this.options.loadBalanceWeight! * loadScore)
    }

    // Room optimization score
    if (this.options.enableRoomOptimization) {
      const roomScore = this.calculateRoomScore(assignment, course, room, violations)
      score *= (1 - this.options.roomOptimizationWeight!) + (this.options.roomOptimizationWeight! * roomScore)
    }

    assignment.violations = violations
    return score
  }

  private calculatePreferenceScore(assignment: StudentAwareAssignment, violations: string[]): number {
    const preferences = this.facultyPreferences.get(assignment.facultyId)
    if (!preferences) return 0.5

    let score = 0.5
    let factors = 0

    // Day preference
    if (preferences.preferredDays.length > 0) {
      if (preferences.preferredDays.includes(assignment.day)) {
        score += 0.2
      } else {
        score -= 0.1
        violations.push('Non-preferred day')
      }
      factors++
    }

    // Time slot preference
    const timeSlotPref = preferences.preferredTimeSlots.find(pref =>
      pref.timeSlotId === assignment.timeSlotId &&
      (pref.dayOfWeek === assignment.day || pref.dayOfWeek === 'ANY')
    )
    
    if (timeSlotPref) {
      const prefScore = PreferenceUtils.preferenceToScore(timeSlotPref.preference)
      score += (prefScore - 0.5) * 0.4
      factors++
      
      if (prefScore < 0.5) {
        violations.push(`Time slot preference: ${timeSlotPref.preference}`)
      }
    }

    // Workload constraints
    const dailyHours = this.calculateDailyHours(assignment.facultyId, assignment.day)
    if (dailyHours >= preferences.maxDailyHours) {
      score -= 0.3
      violations.push('Exceeds max daily hours')
    }
    factors++

    // Back-to-back classes check
    if (preferences.avoidBackToBackClasses) {
      if (this.hasBackToBackClasses(assignment)) {
        score -= 0.2
        violations.push('Back-to-back classes')
      }
    }
    factors++

    // Apply flexibility multiplier
    const flexibility = PreferenceUtils.getFlexibilityMultiplier(preferences.flexibilityLevel)
    score = 0.5 + (score - 0.5) * (1 - flexibility)

    return Math.max(0, Math.min(1, score))
  }

  private calculateLoadBalanceScore(assignment: StudentAwareAssignment, violations: string[]): number {
    let score = 1.0

    // Check day distribution for faculty
    const facultyDays = this.getFacultyDaysCount(assignment.facultyId)
    const dayCount = facultyDays.get(assignment.day) || 0
    
    if (dayCount >= 2) {
      score -= 0.2
      violations.push('Uneven day distribution')
    }

    // Check time slot distribution
    const timeSlotCount = this.getTimeSlotUsage(assignment.timeSlotId)
    const avgTimeSlotUsage = this.assignments.length / this.timeSlots.length
    
    if (timeSlotCount > avgTimeSlotUsage * 1.5) {
      score -= 0.1
      violations.push('Overused time slot')
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateRoomScore(
    assignment: StudentAwareAssignment, 
    course: Course, 
    room: Room, 
    violations: string[]
  ): number {
    let score = 0.5

    // Equipment matching
    if (course.enhancement?.requiredEquipment && room.enhancement?.equipment) {
      const requiredEquipment = course.enhancement.requiredEquipment
      const availableEquipment = room.enhancement.equipment
      
      const hasAllEquipment = requiredEquipment.every(req =>
        availableEquipment.some(avail => avail.name === req.name)
      )
      
      if (hasAllEquipment) {
        score += 0.3
      } else {
        score -= 0.2
        violations.push('Missing required equipment')
      }
    }

    // Department preference matching
    if (room.enhancement?.departmentPreferences) {
      const courseDepartment = course.semester.program.name
      const preferredDepartments = room.enhancement.departmentPreferences
      
      const isPreferred = preferredDepartments.some(dept => 
        courseDepartment.toLowerCase().includes(dept.toLowerCase())
      )
      
      if (isPreferred) {
        score += 0.2
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  // Helper methods (similar to enhanced algorithm but with student awareness)
  private calculateDailyHours(facultyId: number, day: Day): number {
    return this.assignments.filter(a => 
      a.facultyId === facultyId && a.day === day
    ).length
  }

  private hasBackToBackClasses(assignment: StudentAwareAssignment): boolean {
    const timeSlotIndex = this.timeSlots.findIndex(ts => ts.id === assignment.timeSlotId)
    
    // Check previous time slot
    if (timeSlotIndex > 0) {
      const prevTimeSlot = this.timeSlots[timeSlotIndex - 1]
      const hasConflict = this.assignments.some(a =>
        a.facultyId === assignment.facultyId &&
        a.day === assignment.day &&
        a.timeSlotId === prevTimeSlot.id
      )
      if (hasConflict) return true
    }

    // Check next time slot
    if (timeSlotIndex < this.timeSlots.length - 1) {
      const nextTimeSlot = this.timeSlots[timeSlotIndex + 1]
      const hasConflict = this.assignments.some(a =>
        a.facultyId === assignment.facultyId &&
        a.day === assignment.day &&
        a.timeSlotId === nextTimeSlot.id
      )
      if (hasConflict) return true
    }

    return false
  }

  private getFacultyDaysCount(facultyId: number): Map<Day, number> {
    const dayCount = new Map<Day, number>()
    DAYS.forEach(day => dayCount.set(day, 0))
    
    this.assignments
      .filter(a => a.facultyId === facultyId)
      .forEach(a => {
        dayCount.set(a.day, (dayCount.get(a.day) || 0) + 1)
      })
    
    return dayCount
  }

  private getTimeSlotUsage(timeSlotId: number): number {
    return this.assignments.filter(a => a.timeSlotId === timeSlotId).length
  }

  private calculateQualityScore(): number {
    if (this.assignments.length === 0) return 0

    const totalScore = this.assignments.reduce((sum, assignment) => sum + assignment.score, 0)
    return totalScore / this.assignments.length
  }

  private getCapacityAnalysisSummary(): any {
    const summary = {
      totalCourses: this.courses.length,
      coursesWithEnrollments: Array.from(this.enrollmentData.values()).filter(count => count > 0).length,
      totalEnrollments: Array.from(this.enrollmentData.values()).reduce((sum, count) => sum + count, 0),
      averageEnrollmentPerCourse: 0,
      capacityMatches: {
        PERFECT: 0,
        GOOD: 0,
        ACCEPTABLE: 0,
        OVERCROWDED: 0,
        UNDERUTILIZED: 0
      },
      roomSizeRecommendations: {
        SMALL: 0,
        MEDIUM: 0,
        LARGE: 0,
        AUDITORIUM: 0
      },
      capacityIssues: [] as any[]
    }

    // Calculate averages
    const totalEnrollments = Array.from(this.enrollmentData.values()).reduce((sum, count) => sum + count, 0)
    summary.averageEnrollmentPerCourse = totalEnrollments / this.courses.length

    // Analyze capacity matches
    Array.from(this.capacityAnalysis.values()).forEach(analysis => {
      summary.capacityMatches[analysis.capacityMatch]++
      summary.roomSizeRecommendations[analysis.recommendedRoomSize]++
      
      if (analysis.capacityMatch === 'OVERCROWDED') {
        const course = this.courses.find(c => this.capacityAnalysis.get(c.id) === analysis)
        summary.capacityIssues.push({
          courseId: course?.id,
          courseName: course?.name,
          enrollmentCount: analysis.enrollmentCount,
          roomCapacity: analysis.roomCapacity,
          issue: 'OVERCROWDED'
        })
      }
    })

    return summary
  }

  private getEnrollmentSummary(): any {
    const enrollmentsByProgram = new Map<string, number>()
    const enrollmentsBySemester = new Map<number, number>()
    
    this.courses.forEach(course => {
      const enrollment = this.enrollmentData.get(course.id) || 0
      const programName = course.semester.program.name
      const semesterNumber = course.semester.number
      
      enrollmentsByProgram.set(programName, (enrollmentsByProgram.get(programName) || 0) + enrollment)
      enrollmentsBySemester.set(semesterNumber, (enrollmentsBySemester.get(semesterNumber) || 0) + enrollment)
    })

    return {
      totalEnrollments: Array.from(this.enrollmentData.values()).reduce((sum, count) => sum + count, 0),
      enrollmentsByProgram: Object.fromEntries(enrollmentsByProgram),
      enrollmentsBySemester: Object.fromEntries(enrollmentsBySemester),
      coursesWithHighEnrollment: this.courses
        .filter(course => (this.enrollmentData.get(course.id) || 0) > 50)
        .map(course => ({
          id: course.id,
          name: course.name,
          code: course.code,
          enrollment: this.enrollmentData.get(course.id)
        })),
      coursesWithLowEnrollment: this.courses
        .filter(course => (this.enrollmentData.get(course.id) || 0) < 10)
        .map(course => ({
          id: course.id,
          name: course.name,
          code: course.code,
          enrollment: this.enrollmentData.get(course.id)
        }))
    }
  }

  private calculateStatistics(): any {
    const stats = {
      totalCourses: this.courses.length,
      assignedCourses: this.assignments.length,
      qualityScore: this.calculateQualityScore(),
      studentCapacityScore: this.calculateStudentCapacityScore(),
      preferenceViolations: 0,
      hardConstraintViolations: 0,
      capacityViolations: 0,
      facultyWorkload: this.calculateFacultyWorkload(),
      roomUtilization: this.calculateRoomUtilization(),
      timeDistribution: this.calculateTimeDistribution(),
      enrollmentStatistics: this.calculateEnrollmentStatistics(),
      violations: this.getAllViolations()
    }

    // Count violations
    this.assignments.forEach(assignment => {
      stats.preferenceViolations += assignment.violations.length
      if (assignment.roomCapacityMatch < 0.6) {
        stats.capacityViolations++
      }
    })

    return stats
  }

  private calculateStudentCapacityScore(): number {
    if (this.assignments.length === 0) return 0

    const totalCapacityScore = this.assignments.reduce((sum, assignment) => 
      sum + assignment.roomCapacityMatch, 0)
    
    return totalCapacityScore / this.assignments.length
  }

  private calculateEnrollmentStatistics(): any {
    const enrollmentStats = {
      totalEnrollments: 0,
      averageEnrollmentPerCourse: 0,
      maxEnrollment: 0,
      minEnrollment: Infinity,
      coursesWithPerfectCapacityMatch: 0,
      coursesWithCapacityIssues: 0,
      averageCapacityUtilization: 0
    }

    let totalUtilization = 0
    let validUtilizations = 0

    this.assignments.forEach(assignment => {
      const enrollment = assignment.enrollmentCount
      enrollmentStats.totalEnrollments += enrollment
      enrollmentStats.maxEnrollment = Math.max(enrollmentStats.maxEnrollment, enrollment)
      enrollmentStats.minEnrollment = Math.min(enrollmentStats.minEnrollment, enrollment)
      
      if (assignment.roomCapacityMatch >= 0.8) {
        enrollmentStats.coursesWithPerfectCapacityMatch++
      } else if (assignment.roomCapacityMatch < 0.6) {
        enrollmentStats.coursesWithCapacityIssues++
      }
      
      if (assignment.capacityUtilization > 0) {
        totalUtilization += assignment.capacityUtilization
        validUtilizations++
      }
    })

    enrollmentStats.averageEnrollmentPerCourse = enrollmentStats.totalEnrollments / this.assignments.length
    enrollmentStats.averageCapacityUtilization = validUtilizations > 0 ? totalUtilization / validUtilizations : 0

    if (enrollmentStats.minEnrollment === Infinity) {
      enrollmentStats.minEnrollment = 0
    }

    return enrollmentStats
  }

  private calculateFacultyWorkload(): any {
    const workload = new Map<number, any>()
    
    this.assignments.forEach(assignment => {
      if (!workload.has(assignment.facultyId)) {
        const faculty = this.courses.find(c => c.faculty?.id === assignment.facultyId)?.faculty
        workload.set(assignment.facultyId, {
          facultyId: assignment.facultyId,
          facultyName: faculty?.name || 'Unknown',
          totalHours: 0,
          totalStudents: 0,
          daysWorking: new Set<Day>(),
          courses: new Set<number>()
        })
      }
      
      const data = workload.get(assignment.facultyId)!
      data.totalHours += 1
      data.totalStudents += assignment.enrollmentCount
      data.daysWorking.add(assignment.day)
      data.courses.add(assignment.courseId)
    })

    return Array.from(workload.values()).map(data => ({
      ...data,
      daysWorking: data.daysWorking.size,
      courses: data.courses.size,
      averageStudentsPerCourse: data.courses.size > 0 ? data.totalStudents / data.courses.size : 0
    }))
  }

  private calculateRoomUtilization(): any {
    const utilization = new Map<number, any>()
    
    this.rooms.forEach(room => {
      utilization.set(room.id, {
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        capacity: this.getRoomCapacity(room),
        usage: 0,
        totalStudents: 0,
        averageUtilization: 0
      })
    })
    
    this.assignments.forEach(assignment => {
      const data = utilization.get(assignment.roomId)!
      data.usage++
      data.totalStudents += assignment.enrollmentCount
      data.averageUtilization = data.totalStudents / data.usage
    })

    const totalSlots = DAYS.length * this.timeSlots.length
    
    return Array.from(utilization.values()).map(data => ({
      ...data,
      utilizationPercentage: (data.usage / totalSlots) * 100,
      capacityEfficiency: data.capacity > 0 ? (data.averageUtilization / data.capacity) * 100 : 0
    }))
  }

  private calculateTimeDistribution(): any {
    const distribution = new Map<number, any>()
    
    this.timeSlots.forEach(slot => {
      distribution.set(slot.id, {
        timeSlotId: slot.id,
        timeSlot: `${slot.start}-${slot.end}`,
        count: 0,
        totalStudents: 0
      })
    })
    
    this.assignments.forEach(assignment => {
      const data = distribution.get(assignment.timeSlotId)!
      data.count++
      data.totalStudents += assignment.enrollmentCount
    })

    return Array.from(distribution.values()).map(data => ({
      ...data,
      percentage: this.assignments.length > 0 ? (data.count / this.assignments.length) * 100 : 0,
      averageStudentsPerSlot: data.count > 0 ? data.totalStudents / data.count : 0
    }))
  }

  private getAllViolations(): string[] {
    const allViolations: string[] = []
    this.assignments.forEach(assignment => {
      assignment.violations.forEach(violation => {
        if (!allViolations.includes(violation)) {
          allViolations.push(violation)
        }
      })
    })
    return allViolations
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Save timetable with student-aware metrics
  async saveTimetable(assignments: TimetableEntry[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear existing timetable
      await prisma.timetable.deleteMany()

      // Create new timetable entries
      await prisma.timetable.createMany({
        data: assignments
      })

      // Save optimization metrics with student awareness
      const generationId = `student_aware_gen_${Date.now()}`
      const statistics = this.calculateStatistics()
      
      await prisma.optimizationMetrics.create({
        data: {
          generationId,
          algorithmVersion: 'student-aware-v1.0',
          overallQualityScore: statistics.qualityScore,
          constraintSatisfaction: 1.0,
          preferenceSatisfaction: Math.max(0, 1 - (statistics.preferenceViolations / Math.max(1, assignments.length))),
          loadBalanceScore: this.calculateLoadBalanceMetric(),
          resourceUtilization: this.calculateResourceUtilizationMetric(),
          hardConstraintViolations: 0,
          softConstraintViolations: statistics.preferenceViolations + statistics.capacityViolations,
          facultyPreferenceScore: statistics.qualityScore,
          roomUtilizationScore: statistics.studentCapacityScore,
          timeDistributionScore: this.calculateTimeDistributionMetric(),
          generationTimeMs: 0,
          iterationsRequired: 0,
          convergenceAchieved: statistics.qualityScore > 0.85,
          algorithmParameters: {
            ...this.options,
            studentAware: true,
            totalEnrollments: statistics.enrollmentStatistics.totalEnrollments
          },
          constraintWeights: {
            preferenceWeight: this.options.preferenceWeight,
            loadBalanceWeight: this.options.loadBalanceWeight,
            roomOptimizationWeight: this.options.roomOptimizationWeight,
            studentCapacityWeight: this.options.studentCapacityWeight
          }
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error saving student-aware timetable:', error)
      return { success: false, error: 'Failed to save timetable to database' }
    }
  }

  private calculateLoadBalanceMetric(): number {
    const facultyWorkload = this.calculateFacultyWorkload()
    if (facultyWorkload.length === 0) return 1.0

    const hours = facultyWorkload.map(f => f.totalHours)
    const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length
    
    return Math.max(0, 1 - (variance / (avg + 1)))
  }

  private calculateResourceUtilizationMetric(): number {
    const roomUtil = this.calculateRoomUtilization()
    if (roomUtil.length === 0) return 0

    const avgUtilization = roomUtil.reduce((sum, r) => sum + r.utilizationPercentage, 0) / roomUtil.length
    return Math.min(1, avgUtilization / 100)
  }

  private calculateTimeDistributionMetric(): number {
    const timeDistribution = this.calculateTimeDistribution()
    if (timeDistribution.length === 0) return 1.0

    const percentages = timeDistribution.map(t => t.percentage)
    const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / percentages.length
    
    return Math.max(0, 1 - (variance / (avg + 1)))
  }
}