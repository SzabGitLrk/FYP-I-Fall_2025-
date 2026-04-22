import { prisma } from './db'
import { Day, CourseType, RoomType } from '@prisma/client'

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
}

interface Room {
  id: number
  name: string
  type: RoomType
}

interface TimeSlot {
  id: number
  start: string
  end: string
}

interface TimetableEntry {
  courseId: number
  day: Day
  timeSlotId: number
  roomId: number
  facultyId: number
}

interface Conflict {
  type: 'room' | 'faculty' | 'semester'
  message: string
}

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as Day[]

export class TimetableGenerator {
  private courses: Course[] = []
  private rooms: Room[] = []
  private timeSlots: TimeSlot[] = []
  private assignments: TimetableEntry[] = []
  private maxAttempts = 1000

  async generateTimetable(): Promise<{ success: boolean; assignments?: TimetableEntry[]; error?: string }> {
    try {
      // Load all necessary data
      await this.loadData()
      
      // Validate prerequisites
      const validation = this.validatePrerequisites()
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Clear existing assignments
      this.assignments = []

      // Sort courses by priority (lab courses first, then by semester)
      const sortedCourses = this.prioritizeCourses()

      // Attempt to assign all courses
      const result = this.assignCourses(sortedCourses)
      
      if (result.success) {
        return { success: true, assignments: this.assignments }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error in timetable generation:', error)
      return { success: false, error: 'An unexpected error occurred during timetable generation' }
    }
  }

  private async loadData(): Promise<void> {
    // Load courses with faculty and semester information
    this.courses = await prisma.course.findMany({
      include: {
        semester: {
          include: {
            program: true
          }
        },
        faculty: true
      },
      where: {
        faculty: {
          isNot: null
        }
      }
    }) as Course[]

    // Load rooms
    this.rooms = await prisma.room.findMany()

    // Load time slots
    this.timeSlots = await prisma.timeSlot.findMany({
      orderBy: { start: 'asc' }
    })
  }

  private validatePrerequisites(): { valid: boolean; error?: string } {
    if (this.courses.length === 0) {
      return { valid: false, error: 'No courses with assigned faculty found. Please create courses and assign faculty first.' }
    }

    if (this.rooms.length === 0) {
      return { valid: false, error: 'No rooms found. Please create rooms first.' }
    }

    if (this.timeSlots.length === 0) {
      return { valid: false, error: 'No time slots found. Please create time slots first.' }
    }

    // Check if we have appropriate room types for course types
    const hasClassrooms = this.rooms.some(room => room.type === RoomType.CLASSROOM)
    const hasLabs = this.rooms.some(room => room.type === RoomType.LAB)
    const hasTheoryCourses = this.courses.some(course => course.type === CourseType.THEORY)
    const hasLabCourses = this.courses.some(course => course.type === CourseType.LAB)

    if (hasTheoryCourses && !hasClassrooms) {
      return { valid: false, error: 'Theory courses found but no classrooms available.' }
    }

    if (hasLabCourses && !hasLabs) {
      return { valid: false, error: 'Lab courses found but no laboratory rooms available.' }
    }

    return { valid: true }
  }

  private prioritizeCourses(): Course[] {
    return [...this.courses].sort((a, b) => {
      // Lab courses first (they have more constraints)
      if (a.type === CourseType.LAB && b.type === CourseType.THEORY) return -1
      if (a.type === CourseType.THEORY && b.type === CourseType.LAB) return 1
      
      // Then by semester number (higher semesters first as they might have fewer options)
      if (a.semester.number !== b.semester.number) {
        return b.semester.number - a.semester.number
      }
      
      // Finally by course name for consistency
      return a.name.localeCompare(b.name)
    })
  }

  private assignCourses(courses: Course[]): { success: boolean; error?: string } {
    let attempts = 0
    
    while (attempts < this.maxAttempts) {
      this.assignments = []
      let allAssigned = true
      
      for (const course of courses) {
        const assignment = this.findValidAssignment(course)
        if (assignment) {
          this.assignments.push(assignment)
        } else {
          allAssigned = false
          break
        }
      }
      
      if (allAssigned) {
        return { success: true }
      }
      
      attempts++
      
      // Add some randomization to avoid getting stuck in the same pattern
      if (attempts % 100 === 0) {
        this.shuffleArray(courses)
      }
    }
    
    return { 
      success: false, 
      error: `Could not generate a valid timetable after ${this.maxAttempts} attempts. This might be due to insufficient rooms, time slots, or conflicting constraints.` 
    }
  }

  private findValidAssignment(course: Course): TimetableEntry | null {
    const availableRooms = this.getAvailableRooms(course.type)
    const shuffledDays = this.shuffleArray([...DAYS])
    const shuffledTimeSlots = this.shuffleArray([...this.timeSlots])
    const shuffledRooms = this.shuffleArray([...availableRooms])

    for (const day of shuffledDays) {
      for (const timeSlot of shuffledTimeSlots) {
        for (const room of shuffledRooms) {
          const assignment: TimetableEntry = {
            courseId: course.id,
            day: day,
            timeSlotId: timeSlot.id,
            roomId: room.id,
            facultyId: course.faculty!.id
          }

          const conflicts = this.checkConflicts(assignment)
          if (conflicts.length === 0) {
            return assignment
          }
        }
      }
    }

    return null
  }

  private getAvailableRooms(courseType: CourseType): Room[] {
    if (courseType === CourseType.LAB) {
      return this.rooms.filter(room => room.type === RoomType.LAB)
    } else {
      return this.rooms.filter(room => room.type === RoomType.CLASSROOM)
    }
  }

  private checkConflicts(assignment: TimetableEntry): Conflict[] {
    const conflicts: Conflict[] = []

    for (const existingAssignment of this.assignments) {
      // Skip if different day or time slot
      if (existingAssignment.day !== assignment.day || existingAssignment.timeSlotId !== assignment.timeSlotId) {
        continue
      }

      // Check room conflict
      if (existingAssignment.roomId === assignment.roomId) {
        conflicts.push({
          type: 'room',
          message: `Room conflict: Room is already occupied at this time`
        })
      }

      // Check faculty conflict
      if (existingAssignment.facultyId === assignment.facultyId) {
        conflicts.push({
          type: 'faculty',
          message: `Faculty conflict: Faculty member is already teaching at this time`
        })
      }

      // Check semester conflict (same semester cannot have two courses at the same time)
      const existingCourse = this.courses.find(c => c.id === existingAssignment.courseId)
      const newCourse = this.courses.find(c => c.id === assignment.courseId)
      
      if (existingCourse && newCourse && existingCourse.semester.id === newCourse.semester.id) {
        conflicts.push({
          type: 'semester',
          message: `Semester conflict: Semester already has a course scheduled at this time`
        })
      }
    }

    return conflicts
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Method to save generated timetable to database
  async saveTimetable(assignments: TimetableEntry[]): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear existing timetable
      await prisma.timetable.deleteMany()

      // Create new timetable entries
      await prisma.timetable.createMany({
        data: assignments
      })

      return { success: true }
    } catch (error) {
      console.error('Error saving timetable:', error)
      return { success: false, error: 'Failed to save timetable to database' }
    }
  }

  // Method to get timetable statistics
  getStatistics(assignments: TimetableEntry[]): {
    totalCourses: number
    assignedCourses: number
    utilizationByDay: Record<Day, number>
    utilizationByTimeSlot: Record<number, number>
    roomUtilization: Record<number, number>
  } {
    const stats = {
      totalCourses: this.courses.length,
      assignedCourses: assignments.length,
      utilizationByDay: {} as Record<Day, number>,
      utilizationByTimeSlot: {} as Record<number, number>,
      roomUtilization: {} as Record<number, number>
    }

    // Initialize counters
    DAYS.forEach(day => stats.utilizationByDay[day] = 0)
    this.timeSlots.forEach(slot => stats.utilizationByTimeSlot[slot.id] = 0)
    this.rooms.forEach(room => stats.roomUtilization[room.id] = 0)

    // Count assignments
    assignments.forEach(assignment => {
      stats.utilizationByDay[assignment.day]++
      stats.utilizationByTimeSlot[assignment.timeSlotId]++
      stats.roomUtilization[assignment.roomId]++
    })

    return stats
  }
}