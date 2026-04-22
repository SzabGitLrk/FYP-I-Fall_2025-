// Faculty Preference Types

export interface TimeSlotPreference {
  timeSlotId: number
  dayOfWeek: string // 'MONDAY', 'TUESDAY', etc. or 'ANY'
  preference: PreferenceLevel
  reason?: string
}

export interface UnavailableTimeSlot {
  timeSlotId: number
  dayOfWeek: string
  reason?: string
}

export interface TeachingPattern {
  name: string
  description: string
  daysPerWeek: number
  hoursPerDay: number
  preferredTimeRanges: TimeRange[]
}

export interface TimeRange {
  start: string // "09:00"
  end: string   // "15:00"
}

export interface FacultyPreferences {
  id?: number
  facultyId: number
  
  // Time preferences
  preferredTimeSlots: TimeSlotPreference[]
  unavailableTimeSlots: UnavailableTimeSlot[]
  
  // Day preferences
  preferredDays: string[]
  unavailableDays: string[]
  
  // Workload preferences
  maxDailyHours: number
  maxConsecutiveHours: number
  preferredBreakDuration: number // minutes
  
  // Pattern preferences
  preferredTeachingPatterns: TeachingPattern[]
  avoidBackToBackClasses: boolean
  
  // Room and course preferences
  preferredRoomTypes: string[]
  preferredBuildings: string[]
  preferredCourseTypes: string[]
  maxCoursesPerDay: number
  
  // Flexibility settings
  flexibilityLevel: FlexibilityLevel
  priorityLevel: PriorityLevel
  
  // Metadata
  createdAt?: Date
  updatedAt?: Date
}

export interface FacultyPreferencesWithFaculty extends FacultyPreferences {
  faculty: {
    id: number
    name: string
    email: string
    department?: string
  }
}

export interface PreferenceValidationResult {
  isValid: boolean
  warnings: string[]
  conflicts: PreferenceConflict[]
  suggestions: string[]
}

export interface PreferenceConflict {
  type: ConflictType
  message: string
  severity?: 'HIGH' | 'MEDIUM' | 'LOW'
  courseId?: number
  courseName?: string
  timeSlotId?: number
  dayOfWeek?: string
}

export interface PreferenceSatisfactionScore {
  overall: number // 0-1
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

export interface PreferenceViolation {
  type: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  impact: number // 0-1
}

export interface BulkPreferenceOperation {
  action: 'import' | 'export'
  data?: BulkPreferenceData[]
}

export interface BulkPreferenceData {
  facultyId: number
  facultyName: string
  facultyEmail: string
  department?: string
  preferences: Omit<FacultyPreferences, 'id' | 'facultyId' | 'createdAt' | 'updatedAt'>
}

export interface BulkOperationResult {
  successful: number
  failed: number
  errors: string[]
}

export interface PreferenceTemplate {
  faculty: BulkPreferenceData[]
  reference: {
    timeSlots: { id: number; start: string; end: string }[]
    days: string[]
    roomTypes: string[]
    courseTypes: string[]
    flexibilityLevels: string[]
    priorityLevels: string[]
    preferenceLevels: string[]
  }
}

// Enums (matching Prisma schema)
export type PreferenceLevel = 
  | 'STRONGLY_PREFER'
  | 'PREFER'
  | 'NEUTRAL'
  | 'AVOID'
  | 'STRONGLY_AVOID'

export type FlexibilityLevel = 
  | 'STRICT'
  | 'MODERATE'
  | 'FLEXIBLE'

export type PriorityLevel = 
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'

export type ConflictType = 
  | 'SCHEDULING_CONFLICT'
  | 'RESOURCE_CONFLICT'
  | 'PREFERENCE_CONFLICT'
  | 'CAPACITY_CONFLICT'
  | 'EQUIPMENT_CONFLICT'
  | 'WORKLOAD_CONFLICT'
  | 'DAY_PREFERENCE_CONFLICT'
  | 'TIME_PREFERENCE_CONFLICT'
  | 'EXISTING_SCHEDULE_CONFLICT'

// Utility functions for working with preferences
export const PreferenceUtils = {
  // Convert preference level to numeric score (0-1)
  preferenceToScore: (level: PreferenceLevel): number => {
    switch (level) {
      case 'STRONGLY_PREFER': return 1.0
      case 'PREFER': return 0.75
      case 'NEUTRAL': return 0.5
      case 'AVOID': return 0.25
      case 'STRONGLY_AVOID': return 0.0
      default: return 0.5
    }
  },

  // Convert numeric score to preference level
  scoreToPreference: (score: number): PreferenceLevel => {
    if (score >= 0.9) return 'STRONGLY_PREFER'
    if (score >= 0.6) return 'PREFER'
    if (score >= 0.4) return 'NEUTRAL'
    if (score >= 0.1) return 'AVOID'
    return 'STRONGLY_AVOID'
  },

  // Get flexibility multiplier for constraint satisfaction
  getFlexibilityMultiplier: (level: FlexibilityLevel): number => {
    switch (level) {
      case 'STRICT': return 0.2
      case 'MODERATE': return 0.5
      case 'FLEXIBLE': return 0.8
      default: return 0.5
    }
  },

  // Get priority weight for optimization
  getPriorityWeight: (level: PriorityLevel): number => {
    switch (level) {
      case 'HIGH': return 1.0
      case 'MEDIUM': return 0.7
      case 'LOW': return 0.4
      default: return 0.7
    }
  },

  // Validate time slot preference
  validateTimeSlotPreference: (preference: TimeSlotPreference): string[] => {
    const errors: string[] = []
    
    if (!preference.timeSlotId || preference.timeSlotId <= 0) {
      errors.push('Invalid time slot ID')
    }
    
    if (!preference.dayOfWeek) {
      errors.push('Day of week is required')
    }
    
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'ANY']
    if (!validDays.includes(preference.dayOfWeek)) {
      errors.push('Invalid day of week')
    }
    
    return errors
  },

  // Calculate workload distribution score
  calculateWorkloadScore: (preferences: FacultyPreferences, actualHours: number): number => {
    const maxHours = preferences.maxDailyHours
    if (actualHours <= maxHours) {
      return 1.0
    }
    
    // Penalty for exceeding max hours
    const excess = actualHours - maxHours
    return Math.max(0, 1.0 - (excess / maxHours))
  },

  // Check if two preferences conflict
  hasPreferenceConflict: (pref1: TimeSlotPreference, pref2: UnavailableTimeSlot): boolean => {
    return pref1.timeSlotId === pref2.timeSlotId && 
           (pref1.dayOfWeek === pref2.dayOfWeek || 
            pref1.dayOfWeek === 'ANY' || 
            pref2.dayOfWeek === 'ANY')
  }
}