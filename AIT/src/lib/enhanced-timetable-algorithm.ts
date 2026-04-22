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
  enhancement?: {
    expectedEnrollment: number
    requiredEquipment: any[]
    preferredTimeSlots: any[]
    avoidTimeSlots: any[]
  }
}

interface Room {
  id: number
  name: string
  type: RoomType
  enhancement?: {
    capacity: number
    optimalCapacity: number
    equipment: any[]
    suitableForCourseTypes: string[]
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

interface Assignment extends TimetableEntry {
  score: number // Quality score for this assignment
  violations: string[] // List of soft constraint violations
}

interface GenerationOptions {
  maxAttempts?: number
  preferenceWeight?: number // 0-1, how much to weight preferences vs hard constraints
  loadBalanceWeight?: number // 0-1, how much to weight load balancing
  roomOptimizationWeight?: number // 0-1, how much to weight room optimization
  enablePreferences?: boolean
  enableLoadBalancing?: boolean
  enableRoomOptimization?: boolean
}

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as Day[]

export class EnhancedTimetableGenerator {
  private courses: Course[] = []
  private rooms: Room[] = []
  private timeSlots: TimeSlot[] = []
  private facultyPreferences: Map<number, FacultyPreference> = new Map()
  private assignments: Assignment[] = []
  private options: GenerationOptions = {
    maxAttempts: 2000,
    preferenceWeight: 0.7,
    loadBalanceWeight: 0.5,
    roomOptimizationWeight: 0.3,
    enablePreferences: true,
    enableLoadBalancing: true,
    enableRoomOptimization: true
  }

  async generateTimetable(options?: Partial<GenerationOptions>): Promise<{
    success: boolean
    assignments?: TimetableEntry[]
    statistics?: any
    qualityScore?: number
    error?: string
  }> {
    try {
      // Merge options
      this.options = { ...this.options, ...options }

      // Load all necessary data
      await this.loadData()
      
      // Validate prerequisites
      const validation = this.validatePrerequisites()
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Clear existing assignments
      this.assignments = []

      // Generate timetable using enhanced algorithm
      const result = await this.generateOptimizedTimetable()
      
      if (result.success) {
        const statistics = this.calculateStatistics()
        const qualityScore = this.calculateQualityScore()
        
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
          qualityScore
        }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error in enhanced timetable generation:', error)
      return { success: false, error: 'An unexpected error occurred during timetable generation' }
    }
  }

  private async loadData(): Promise<void> {
    // Load courses with enhancements
    this.courses = await prisma.course.findMany({
      include: {
        semester: {
          include: {
            program: true
          }
        },
        faculty: true,
        enhancement: true
      },
      where: {
        faculty: {
          isNot: null
        }
      }
    }) as Course[]

    // Load rooms with enhancements
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

    return { valid: true }
  }

  private async generateOptimizedTimetable(): Promise<{ success: boolean; error?: string }> {
    let bestSolution: Assignment[] = []
    let bestScore = -1
    let attempts = 0

    while (attempts < this.options.maxAttempts!) {
      this.assignments = []
      
      // Sort courses by priority considering preferences
      const sortedCourses = this.prioritizeCoursesWithPreferences()
      
      // Try to assign all courses
      let allAssigned = true
      for (const course of sortedCourses) {
        const assignment = this.findOptimalAssignment(course)
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
        if (score > 0.9) {
          break
        }
      }
      
      attempts++
      
      // Add randomization to explore different solutions
      if (attempts % 200 === 0) {
        this.shuffleArray(sortedCourses)
      }
    }
    
    if (bestSolution.length > 0) {
      this.assignments = bestSolution
      return { success: true }
    }
    
    return { 
      success: false, 
      error: `Could not generate a valid timetable after ${this.options.maxAttempts} attempts.` 
    }
  }

  private prioritizeCoursesWithPreferences(): Course[] {
    return [...this.courses].sort((a, b) => {
      // Lab courses first (more constraints)
      if (a.type === CourseType.LAB && b.type === CourseType.THEORY) return -1
      if (a.type === CourseType.THEORY && b.type === CourseType.LAB) return 1
      
      // Consider faculty priority levels
      const aPrefs = this.facultyPreferences.get(a.faculty!.id)
      const bPrefs = this.facultyPreferences.get(b.faculty!.id)
      
      if (aPrefs && bPrefs) {
        const aPriority = PreferenceUtils.getPriorityWeight(aPrefs.priorityLevel)
        const bPriority = PreferenceUtils.getPriorityWeight(bPrefs.priorityLevel)
        if (aPriority !== bPriority) {
          return bPriority - aPriority // Higher priority first
        }
      }
      
      // Higher semesters first
      if (a.semester.number !== b.semester.number) {
        return b.semester.number - a.semester.number
      }
      
      return a.name.localeCompare(b.name)
    })
  }

  private findOptimalAssignment(course: Course): Assignment | null {
    const candidates: Assignment[] = []
    
    // Generate all possible assignments
    for (const day of DAYS) {
      for (const timeSlot of this.timeSlots) {
        for (const room of this.getAvailableRooms(course)) {
          const assignment: Assignment = {
            courseId: course.id,
            day: day,
            timeSlotId: timeSlot.id,
            roomId: room.id,
            facultyId: course.faculty!.id,
            score: 0,
            violations: []
          }

          // Check hard constraints
          if (this.hasHardConstraintViolations(assignment)) {
            continue
          }

          // Calculate quality score
          assignment.score = this.calculateAssignmentScore(assignment, course)
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

  private getAvailableRooms(course: Course): Room[] {
    let availableRooms = this.rooms

    // Filter by course type
    if (course.type === CourseType.LAB) {
      availableRooms = availableRooms.filter(room => room.type === RoomType.LAB)
    } else {
      availableRooms = availableRooms.filter(room => room.type === RoomType.CLASSROOM)
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

  private hasHardConstraintViolations(assignment: Assignment): boolean {
    for (const existing of this.assignments) {
      if (existing.day !== assignment.day || existing.timeSlotId !== assignment.timeSlotId) {
        continue
      }

      // Room conflict
      if (existing.roomId === assignment.roomId) {
        return true
      }

      // Faculty conflict
      if (existing.facultyId === assignment.facultyId) {
        return true
      }

      // Semester conflict
      const existingCourse = this.courses.find(c => c.id === existing.courseId)
      const newCourse = this.courses.find(c => c.id === assignment.courseId)
      
      if (existingCourse && newCourse && existingCourse.semester.id === newCourse.semester.id) {
        return true
      }
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

  private calculateAssignmentScore(assignment: Assignment, course: Course): number {
    let score = 1.0 // Base score
    const violations: string[] = []

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
      const roomScore = this.calculateRoomScore(assignment, course, violations)
      score *= (1 - this.options.roomOptimizationWeight!) + (this.options.roomOptimizationWeight! * roomScore)
    }

    assignment.violations = violations
    return score
  }

  private calculatePreferenceScore(assignment: Assignment, violations: string[]): number {
    const preferences = this.facultyPreferences.get(assignment.facultyId)
    if (!preferences) return 0.5 // Neutral if no preferences

    let score = 0.5 // Start neutral
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
      score += (prefScore - 0.5) * 0.4 // Scale to -0.2 to +0.2
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

  private calculateLoadBalanceScore(assignment: Assignment, violations: string[]): number {
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

  private calculateRoomScore(assignment: Assignment, course: Course, violations: string[]): number {
    const room = this.rooms.find(r => r.id === assignment.roomId)
    if (!room || !room.enhancement) return 0.5

    let score = 0.5

    // Capacity matching
    if (course.enhancement?.expectedEnrollment) {
      const enrollment = course.enhancement.expectedEnrollment
      const capacity = room.enhancement.capacity
      const optimal = room.enhancement.optimalCapacity

      if (enrollment <= optimal) {
        score += 0.3 // Perfect fit
      } else if (enrollment <= capacity) {
        score += 0.1 // Acceptable fit
      } else {
        score -= 0.4 // Overcrowded
        violations.push('Room capacity exceeded')
      }
    }

    // Equipment matching
    if (course.enhancement?.requiredEquipment) {
      const requiredEquipment = course.enhancement.requiredEquipment
      const availableEquipment = room.enhancement.equipment || []
      
      const hasAllEquipment = requiredEquipment.every(req =>
        availableEquipment.some(avail => avail.name === req.name)
      )
      
      if (hasAllEquipment) {
        score += 0.2
      } else {
        score -= 0.3
        violations.push('Missing required equipment')
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  private calculateDailyHours(facultyId: number, day: Day): number {
    return this.assignments.filter(a => 
      a.facultyId === facultyId && a.day === day
    ).length
  }

  private hasBackToBackClasses(assignment: Assignment): boolean {
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

  private calculateStatistics(): any {
    const stats = {
      totalCourses: this.courses.length,
      assignedCourses: this.assignments.length,
      qualityScore: this.calculateQualityScore(),
      preferenceViolations: 0,
      hardConstraintViolations: 0,
      facultyWorkload: this.calculateFacultyWorkload(),
      roomUtilization: this.calculateRoomUtilization(),
      timeDistribution: this.calculateTimeDistribution(),
      violations: this.getAllViolations()
    }

    // Count violations
    this.assignments.forEach(assignment => {
      stats.preferenceViolations += assignment.violations.length
    })

    return stats
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
          daysWorking: new Set<Day>(),
          courses: new Set<number>()
        })
      }
      
      const data = workload.get(assignment.facultyId)!
      data.totalHours += 1 // Assuming 1 hour per time slot
      data.daysWorking.add(assignment.day)
      data.courses.add(assignment.courseId)
    })

    return Array.from(workload.values()).map(data => ({
      ...data,
      daysWorking: data.daysWorking.size,
      courses: data.courses.size
    }))
  }

  private calculateRoomUtilization(): any {
    const utilization = new Map<number, number>()
    
    this.rooms.forEach(room => {
      utilization.set(room.id, 0)
    })
    
    this.assignments.forEach(assignment => {
      utilization.set(assignment.roomId, (utilization.get(assignment.roomId) || 0) + 1)
    })

    const totalSlots = DAYS.length * this.timeSlots.length
    
    return Array.from(utilization.entries()).map(([roomId, usage]) => {
      const room = this.rooms.find(r => r.id === roomId)
      return {
        roomId,
        roomName: room?.name || 'Unknown',
        usage,
        utilizationPercentage: (usage / totalSlots) * 100
      }
    })
  }

  private calculateTimeDistribution(): any {
    const distribution = new Map<number, number>()
    
    this.timeSlots.forEach(slot => {
      distribution.set(slot.id, 0)
    })
    
    this.assignments.forEach(assignment => {
      distribution.set(assignment.timeSlotId, (distribution.get(assignment.timeSlotId) || 0) + 1)
    })

    return Array.from(distribution.entries()).map(([timeSlotId, count]) => {
      const timeSlot = this.timeSlots.find(ts => ts.id === timeSlotId)
      return {
        timeSlotId,
        timeSlot: timeSlot ? `${timeSlot.start}-${timeSlot.end}` : 'Unknown',
        count,
        percentage: (count / this.assignments.length) * 100
      }
    })
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

  // Save timetable with optimization metrics
  async saveTimetable(assignments: TimetableEntry[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear existing timetable
      await prisma.timetable.deleteMany()

      // Create new timetable entries
      await prisma.timetable.createMany({
        data: assignments
      })

      // Save optimization metrics
      const generationId = `gen_${Date.now()}`
      const statistics = this.calculateStatistics()
      
      await prisma.optimizationMetrics.create({
        data: {
          generationId,
          algorithmVersion: 'enhanced-v1.0',
          overallQualityScore: statistics.qualityScore,
          constraintSatisfaction: 1.0, // No hard constraint violations if we got here
          preferenceSatisfaction: Math.max(0, 1 - (statistics.preferenceViolations / Math.max(1, assignments.length))),
          loadBalanceScore: this.calculateLoadBalanceMetric(),
          resourceUtilization: this.calculateResourceUtilizationMetric(),
          hardConstraintViolations: 0,
          softConstraintViolations: statistics.preferenceViolations,
          facultyPreferenceScore: statistics.qualityScore,
          roomUtilizationScore: this.calculateRoomUtilizationMetric(),
          timeDistributionScore: this.calculateTimeDistributionMetric(),
          generationTimeMs: 0, // Would be calculated by caller
          iterationsRequired: 0, // Would be calculated by caller
          convergenceAchieved: statistics.qualityScore > 0.8,
          algorithmParameters: this.options,
          constraintWeights: {
            preferenceWeight: this.options.preferenceWeight,
            loadBalanceWeight: this.options.loadBalanceWeight,
            roomOptimizationWeight: this.options.roomOptimizationWeight
          }
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error saving enhanced timetable:', error)
      return { success: false, error: 'Failed to save timetable to database' }
    }
  }

  private calculateLoadBalanceMetric(): number {
    const facultyWorkload = this.calculateFacultyWorkload()
    if (facultyWorkload.length === 0) return 1.0

    const hours = facultyWorkload.map(f => f.totalHours)
    const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length
    
    // Lower variance = better balance
    return Math.max(0, 1 - (variance / (avg + 1)))
  }

  private calculateResourceUtilizationMetric(): number {
    const roomUtil = this.calculateRoomUtilization()
    if (roomUtil.length === 0) return 0

    const avgUtilization = roomUtil.reduce((sum, r) => sum + r.utilizationPercentage, 0) / roomUtil.length
    return Math.min(1, avgUtilization / 100)
  }

  private calculateRoomUtilizationMetric(): number {
    return this.calculateResourceUtilizationMetric()
  }

  private calculateTimeDistributionMetric(): number {
    const timeDistribution = this.calculateTimeDistribution()
    if (timeDistribution.length === 0) return 1.0

    const percentages = timeDistribution.map(t => t.percentage)
    const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / percentages.length
    
    // Lower variance = better distribution
    return Math.max(0, 1 - (variance / (avg + 1)))
  }
}