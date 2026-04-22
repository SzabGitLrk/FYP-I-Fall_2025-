// Enums matching Prisma schema
export enum CourseType {
  THEORY = 'THEORY',
  LAB = 'LAB'
}

export enum RoomType {
  CLASSROOM = 'CLASSROOM',
  LAB = 'LAB'
}

export enum Day {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY'
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface CreateProgramForm {
  name: string
}

export interface CreateSemesterForm {
  number: number
  programId: number
}

export interface CreateCourseForm {
  name: string
  code?: string
  type: CourseType
  semesterId: number
  facultyId?: number
}

export interface CreateFacultyForm {
  name: string
  email: string
}

export interface CreateRoomForm {
  name: string
  type: RoomType
}

export interface CreateTimeSlotForm {
  start: string
  end: string
}

// Timetable types
export interface TimetableEntry {
  id: number
  day: Day
  course: {
    id: number
    name: string
    code: string | null
    type: CourseType
    semester: {
      number: number
      program: {
        name: string
      }
    }
  }
  room: {
    id: number
    name: string
    type: RoomType
  }
  faculty: {
    id: number
    name: string
  }
  timeslot: {
    id: number
    start: string
    end: string
  }
}

export interface TimetableFilter {
  programId?: number
  semesterId?: number
}