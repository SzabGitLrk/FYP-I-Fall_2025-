import { prisma } from './db'
import { 
  PreferenceLevel, 
  FlexibilityLevel, 
  PriorityLevel,
  Day 
} from '@prisma/client'
import { PreferenceUtils } from '@/types/faculty-preferences'

interface TimetableEntry {
  id: number
  day: Day
  courseId: number
  facultyId: number
  roomId: number
  timeSlotId: number
  course: {
    name: string
    type: string
  }
  room: {
    name: string
    type: string
  }
  timeslot: {
    start: string
    end: string
  }
}

interface PreferenceSatisfactionScore {
  overall: number
  timeSlotSatisfaction: number
  dayPreferenceSatisfaction: number
  workloadSatisfaction: number
  roomPreferenceSatisfaction: number
  details: {
    satisfiedPreferences: number
    totalPreferences: number
    violations: PreferenceViolation[]
  }
}

interface PreferenceViolation {
  type: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  impact: number
}

interface FacultyPreferences {
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
  maxCoursesPerDay: number
  avoidBackToBackClasses: boolean
  preferredRoomTypes: string[]
  flexibilityLevel: FlexibilityLevel
  priorityLevel: PriorityLevel
}

export class PreferenceScoringEngine {
  /**
   * Calculate preference satisfaction score for a faculty member
   */
  async calculateFacultyPreferenceSatisfaction(
    facultyId: number,
    timetable?: TimetableEntry[]
  ): Promise<PreferenceSatisfactionScore> {
    // Load faculty preferences
    const preferences = await prisma.facultyPreference.findUnique({
      where: { facultyId },
      include: {
        faculty: true
      }
    })

    if (!preferences) {
      return this.getDefaultScore()
    }

    // Load faculty's current schedule if not provided
    if (!timetable) {
      timetable = await prisma.timetable.findMany({
        where: { facultyId },
        include: {
          course: true,
          room: true,
          timeslot: true
        }
      }) as any
    } else {
      // Filter for this faculty
      timetable = timetable.filter(entry => entry.facultyId === facultyId)
    }

    if (timetable.length === 0) {
      return this.getDefaultScore()
    }

    const facultyPrefs: FacultyPreferences = {
      facultyId: preferences.facultyId,
      preferredTimeSlots: preferences.preferredTimeSlots as any[],
      unavailableTimeSlots: preferences.unavailableTimeSlots as any[],
      preferredDays: preferences.preferredDays as string[],
      unavailableDays: preferences.unavailableDays as string[],
      maxDailyHours: preferences.maxDailyHours,
      maxConsecutiveHours: preferences.maxConsecutiveHours,
      maxCoursesPerDay: preferences.maxCoursesPerDay,
      avoidBackToBackClasses: preferences.avoidBackToBackClasses,
      preferredRoomTypes: preferences.preferredRoomTypes as string[],
      flexibilityLevel: preferences.flexibilityLevel,
      priorityLevel: preferences.priorityLevel
    }

    const scores = {
      timeSlotSatisfaction: this.calculateTimeSlotSatisfaction(facultyPrefs, timetable),
      dayPreferenceSatisfaction: this.calculateDayPreferenceSatisfaction(facultyPrefs, timetable),
      workloadSatisfaction: this.calculateWorkloadSatisfaction(facultyPrefs, timetable),
      roomPreferenceSatisfaction: this.calculateRoomPreferenceSatisfaction(facultyPrefs, timetable)
    }

    const overall = (scores.timeSlotSatisfaction + scores.dayPreferenceSatisfaction + 
                    scores.workloadSatisfaction + scores.roomPreferenceSatisfaction) / 4

    const violations = this.detectPreferenceViolations(facultyPrefs, timetable)

    return {
      overall,
      ...scores,
      details: {
        satisfiedPreferences: this.countSatisfiedPreferences(facultyPrefs, timetable),
        totalPreferences: this.countTotalPreferences(facultyPrefs),
        violations
      }
    }
  }

  /**
   * Calculate time slot preference satisfaction
   */
  private calculateTimeSlotSatisfaction(
    preferences: FacultyPreferences,
    timetable: TimetableEntry[]
  ): number {
    if (preferences.preferredTimeSlots.length === 0) {
      return 1.0 // No preferences = fully satisfied
    }

    let totalScore = 0
    let totalWeight = 0

    timetable.forEach(entry => {
      // Find matching preference
      const preference = preferences.preferredTimeSlots.find(pref => 
        pref.timeSlotId === entry.timeSlotId && 
        (pref.dayOfWeek === entry.day || pref.dayOfWeek === 'ANY')
      )

      if (preference) {
        const score = PreferenceUtils.preferenceToScore(preference.preference)
        totalScore += score
        totalWeight += 1
      } else {
        // No specific preference = neutral
        totalScore += 0.5
        totalWeight += 1
      }

      // Check for unavailable time slots (major violation)
      const isUnavailable = preferences.unavailableTimeSlots.some(unavail => 
        unavail.timeSlotId === entry.timeSlotId && 
        (unavail.dayOfWeek === entry.day || unavail.dayOfWeek === 'ANY')
      )

      if (isUnavailable) {
        totalScore -= 0.5 // Heavy penalty
      }
    })

    return totalWeight > 0 ? Math.max(0, totalScore / totalWeight) : 1.0
  }

  /**
   * Calculate day preference satisfaction
   */
  private calculateDayPreferenceSatisfaction(
    preferences: FacultyPreferences,
    timetable: TimetableEntry[]
  ): number {
    const scheduledDays = new Set(timetable.map(entry => entry.day))
    
    let score = 1.0

    // Check preferred days
    if (preferences.preferredDays.length > 0) {
      const preferredDaysScheduled = Array.from(scheduledDays)
        .filter(day => preferences.preferredDays.includes(day)).length
      
      const preferredDaysRatio = preferredDaysScheduled / scheduledDays.size
      score *= preferredDaysRatio
    }

    // Penalty for unavailable days
    const unavailableDaysScheduled = Array.from(scheduledDays)
      .filter(day => preferences.unavailableDays.includes(day)).length
    
    if (unavailableDaysScheduled > 0) {
      score -= (unavailableDaysScheduled / scheduledDays.size) * 0.5
    }

    return Math.max(0, score)
  }

  /**
   * Calculate workload satisfaction based on limits
   */
  private calculateWorkloadSatisfaction(
    preferences: FacultyPreferences,
    timetable: TimetableEntry[]
  ): number {
    let score = 1.0

    // Group by day to check daily limits
    const dailySchedule = new Map<string, TimetableEntry[]>()
    timetable.forEach(entry => {
      if (!dailySchedule.has(entry.day)) {
        dailySchedule.set(entry.day, [])
      }
      dailySchedule.get(entry.day)!.push(entry)
    })

    // Check daily hour limits
    dailySchedule.forEach((dayEntries, day) => {
      const dailyHours = dayEntries.length // Assuming 1 hour per session
      
      if (dailyHours > preferences.maxDailyHours) {
        const excess = dailyHours - preferences.maxDailyHours
        score -= (excess / preferences.maxDailyHours) * 0.3
      }

      // Check courses per day limit
      if (dayEntries.length > preferences.maxCoursesPerDay) {
        const excess = dayEntries.length - preferences.maxCoursesPerDay
        score -= (excess / preferences.maxCoursesPerDay) * 0.2
      }

      // Check for back-to-back classes if avoided
      if (preferences.avoidBackToBackClasses) {
        const sortedEntries = dayEntries.sort((a, b) => 
          a.timeslot.start.localeCompare(b.timeslot.start)
        )
        
        for (let i = 0; i < sortedEntries.length - 1; i++) {
          const current = sortedEntries[i]
          const next = sortedEntries[i + 1]
          
          // Check if they are consecutive (simplified check)
          if (this.areConsecutiveTimeSlots(current.timeslot, next.timeslot)) {
            score -= 0.1
          }
        }
      }
    })

    return Math.max(0, score)
  }

  /**
   * Calculate room preference satisfaction
   */
  private calculateRoomPreferenceSatisfaction(
    preferences: FacultyPreferences,
    timetable: TimetableEntry[]
  ): number {
    if (preferences.preferredRoomTypes.length === 0) {
      return 1.0 // No preferences = fully satisfied
    }

    const totalSessions = timetable.length
    const preferredRoomSessions = timetable.filter(entry => 
      preferences.preferredRoomTypes.includes(entry.room.type)
    ).length

    return totalSessions > 0 ? preferredRoomSessions / totalSessions : 1.0
  }

  /**
   * Detect specific preference violations
   */
  private detectPreferenceViolations(
    preferences: FacultyPreferences,
    timetable: TimetableEntry[]
  ): PreferenceViolation[] {
    const violations: PreferenceViolation[] = []

    timetable.forEach(entry => {
      // Check unavailable time slots
      const isUnavailable = preferences.unavailableTimeSlots.some(unavail => 
        unavail.timeSlotId === entry.timeSlotId && 
        (unavail.dayOfWeek === entry.day || unavail.dayOfWeek === 'ANY')
      )

      if (isUnavailable) {
        violations.push({
          type: 'UNAVAILABLE_TIME_SLOT',
          description: `Scheduled during unavailable time: ${entry.day} ${entry.timeslot.start}-${entry.timeslot.end}`,
          severity: 'HIGH',
          impact: 0.8
        })
      }

      // Check unavailable days
      if (preferences.unavailableDays.includes(entry.day)) {
        violations.push({
          type: 'UNAVAILABLE_DAY',
          description: `Scheduled on unavailable day: ${entry.day}`,
          severity: 'HIGH',
          impact: 0.7
        })
      }

      // Check strongly avoided time slots
      const stronglyAvoided = preferences.preferredTimeSlots.find(pref => 
        pref.timeSlotId === entry.timeSlotId && 
        (pref.dayOfWeek === entry.day || pref.dayOfWeek === 'ANY') &&
        pref.preference === 'STRONGLY_AVOID'
      )

      if (stronglyAvoided) {
        violations.push({
          type: 'STRONGLY_AVOIDED_TIME',
          description: `Scheduled during strongly avoided time: ${entry.day} ${entry.timeslot.start}-${entry.timeslot.end}`,
          severity: 'MEDIUM',
          impact: 0.5
        })
      }
    })

    // Check workload violations
    const dailySchedule = new Map<string, TimetableEntry[]>()
    timetable.forEach(entry => {
      if (!dailySchedule.has(entry.day)) {
        dailySchedule.set(entry.day, [])
      }
      dailySchedule.get(entry.day)!.push(entry)
    })

    dailySchedule.forEach((dayEntries, day) => {
      if (dayEntries.length > preferences.maxDailyHours) {
        violations.push({
          type: 'DAILY_HOUR_LIMIT_EXCEEDED',
          description: `Exceeds daily hour limit on ${day}: ${dayEntries.length}h > ${preferences.maxDailyHours}h`,
          severity: 'MEDIUM',
          impact: 0.4
        })
      }

      if (dayEntries.length > preferences.maxCoursesPerDay) {
        violations.push({
          type: 'DAILY_COURSE_LIMIT_EXCEEDED',
          description: `Exceeds daily course limit on ${day}: ${dayEntries.length} > ${preferences.maxCoursesPerDay}`,
          severity: 'LOW',
          impact: 0.3
        })
      }
    })

    return violations
  }

  /**
   * Count satisfied preferences
   */
  private countSatisfiedPreferences(
    preferences: FacultyPreferences,
    timetable: TimetableEntry[]
  ): number {
    let satisfied = 0

    // Count preferred time slots that are satisfied
    timetable.forEach(entry => {
      const preference = preferences.preferredTimeSlots.find(pref => 
        pref.timeSlotId === entry.timeSlotId && 
        (pref.dayOfWeek === entry.day || pref.dayOfWeek === 'ANY') &&
        (pref.preference === 'PREFER' || pref.preference === 'STRONGLY_PREFER')
      )

      if (preference) satisfied++
    })

    // Count preferred days that are used
    if (preferences.preferredDays.length > 0) {
      const scheduledDays = new Set(timetable.map(entry => entry.day))
      const preferredDaysUsed = Array.from(scheduledDays)
        .filter(day => preferences.preferredDays.includes(day)).length
      satisfied += preferredDaysUsed
    }

    return satisfied
  }

  /**
   * Count total preferences
   */
  private countTotalPreferences(preferences: FacultyPreferences): number {
    return preferences.preferredTimeSlots.length + 
           preferences.preferredDays.length +
           preferences.preferredRoomTypes.length
  }

  /**
   * Check if two time slots are consecutive
   */
  private areConsecutiveTimeSlots(
    slot1: { start: string; end: string },
    slot2: { start: string; end: string }
  ): boolean {
    return slot1.end === slot2.start
  }

  /**
   * Get default score when no preferences exist
   */
  private getDefaultScore(): PreferenceSatisfactionScore {
    return {
      overall: 1.0,
      timeSlotSatisfaction: 1.0,
      dayPreferenceSatisfaction: 1.0,
      workloadSatisfaction: 1.0,
      roomPreferenceSatisfaction: 1.0,
      details: {
        satisfiedPreferences: 0,
        totalPreferences: 0,
        violations: []
      }
    }
  }

  /**
   * Calculate overall timetable preference satisfaction
   */
  async calculateOverallPreferenceSatisfaction(): Promise<{
    averageSatisfaction: number
    facultySatisfaction: Array<{
      facultyId: number
      facultyName: string
      satisfaction: number
      violations: number
    }>
    totalViolations: number
  }> {
    const faculty = await prisma.faculty.findMany({
      include: {
        preferences: true
      }
    })

    const results = []
    let totalSatisfaction = 0
    let totalViolations = 0

    for (const facultyMember of faculty) {
      if (facultyMember.preferences) {
        const score = await this.calculateFacultyPreferenceSatisfaction(facultyMember.id)
        
        results.push({
          facultyId: facultyMember.id,
          facultyName: facultyMember.name,
          satisfaction: score.overall,
          violations: score.details.violations.length
        })

        totalSatisfaction += score.overall
        totalViolations += score.details.violations.length
      }
    }

    return {
      averageSatisfaction: results.length > 0 ? totalSatisfaction / results.length : 1.0,
      facultySatisfaction: results,
      totalViolations
    }
  }
}

export const preferenceScoringEngine = new PreferenceScoringEngine()