"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  MapPin, 
  Clock, 
  Calendar, 
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Department {
  id: number
  name: string
  code?: string
}

interface Program {
  id: number
  name: string
  department?: Department
}

interface Semester {
  id: number
  number: number
  program: Program
}

interface Faculty {
  id: number
  name: string
}

interface Course {
  id: number
  name: string
  code: string | null
  type: string
  semester: Semester
  faculty: Faculty
  enrollments?: Array<{
    id: number
    student: {
      id: number
      regId: string
      regName: string
    }
  }>
  enhancement?: {
    expectedEnrollment: number
    maxEnrollment: number
    minEnrollment: number
  }
}

interface Room {
  id: number
  name: string
  type: string
  minCapacity?: number
  maxCapacity?: number
  enhancement?: {
    capacity: number
    optimalCapacity: number
    equipment?: any[]
  }
}

interface TimeSlot {
  id: number
  start: string
  end: string
}

interface TimetableEntry {
  id: number
  day: string
  course: Course
  room: Room
  timeslot: TimeSlot
  faculty: Faculty
}

interface TimetableDayViewProps {
  entries: TimetableEntry[]
  timeSlots: TimeSlot[]
  rooms: Room[]
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Helper function to get room capacity
function getRoomCapacity(room: Room): number {
  if (room.maxCapacity) return room.maxCapacity
  if (room.enhancement?.capacity) return room.enhancement.capacity
  if (room.minCapacity) return room.minCapacity
  return room.type === 'LAB' ? 25 : 50 // Default capacities
}

// Helper function to get capacity utilization info
function getCapacityInfo(enrollmentCount: number, room: Room) {
  const capacity = getRoomCapacity(room)
  const utilization = capacity > 0 ? (enrollmentCount / capacity) * 100 : 0
  
  let status: 'perfect' | 'good' | 'acceptable' | 'overcrowded' | 'underutilized' = 'acceptable'
  let statusColor = 'bg-yellow-100 text-yellow-800'
  
  if (utilization >= 80 && utilization <= 100) {
    status = 'perfect'
    statusColor = 'bg-green-100 text-green-800'
  } else if (utilization >= 60 && utilization < 80) {
    status = 'good'
    statusColor = 'bg-blue-100 text-blue-800'
  } else if (utilization > 100) {
    status = 'overcrowded'
    statusColor = 'bg-red-100 text-red-800'
  } else if (utilization < 40) {
    status = 'underutilized'
    statusColor = 'bg-gray-100 text-gray-800'
  }
  
  return {
    capacity,
    utilization: Math.round(utilization),
    status,
    statusColor
  }
}

export function TimetableDayView({ entries, timeSlots, rooms }: TimetableDayViewProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0)

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getDepartmentColor = (department?: Department): string => {
    if (!department) {
      return 'bg-gray-100 text-gray-800 border-gray-200' // Default for unknown department
    }

    // Department-specific color mapping
    const departmentColors: Record<string, string> = {
      'Computer Science': 'bg-green-100 text-green-800 border-green-200',
      'Business Administration': 'bg-red-100 text-red-800 border-red-200', // Maroon-ish
      'Mathematics': 'bg-blue-100 text-blue-800 border-blue-200',
      'Software Engineering': 'bg-emerald-100 text-emerald-800 border-emerald-200', // Light green variant
      'Management Sciences': 'bg-rose-100 text-rose-800 border-rose-200', // Maroon
      'Engineering': 'bg-orange-100 text-orange-800 border-orange-200',
      'Sciences': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Arts': 'bg-purple-100 text-purple-800 border-purple-200',
      'Medicine': 'bg-pink-100 text-pink-800 border-pink-200',
      'Law': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }

    // Try to match by department name
    const color = departmentColors[department.name]
    if (color) return color

    // Try to match by department code
    if (department.code) {
      const codeColors: Record<string, string> = {
        'CS': 'bg-green-100 text-green-800 border-green-200',
        'BBA': 'bg-red-100 text-red-800 border-red-200',
        'MATH': 'bg-blue-100 text-blue-800 border-blue-200',
        'SE': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'MS': 'bg-rose-100 text-rose-800 border-rose-200',
        'ENG': 'bg-orange-100 text-orange-800 border-orange-200'
      }
      const codeColor = codeColors[department.code]
      if (codeColor) return codeColor
    }

    // Fallback to hash-based color for consistency
    const fallbackColors = [
      'bg-slate-100 text-slate-800 border-slate-200',
      'bg-zinc-100 text-zinc-800 border-zinc-200',
      'bg-neutral-100 text-neutral-800 border-neutral-200',
      'bg-stone-100 text-stone-800 border-stone-200'
    ]
    
    let hash = 0
    for (let i = 0; i < department.name.length; i++) {
      hash = department.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return fallbackColors[Math.abs(hash) % fallbackColors.length]
  }

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const currentDay = DAYS[currentDayIndex]
  const currentDayLabel = DAY_LABELS[currentDayIndex]
  const dayEntries = entries.filter(entry => entry.day === currentDay)

  const getEntriesForTimeSlot = (timeSlotId: number) => {
    return dayEntries.filter(entry => entry.timeslot.id === timeSlotId)
  }

  const getUsedRooms = (timeSlotId: number) => {
    return getEntriesForTimeSlot(timeSlotId).map(entry => entry.room.id)
  }

  const getAvailableRooms = (timeSlotId: number) => {
    const usedRoomIds = getUsedRooms(timeSlotId)
    return rooms.filter(room => !usedRoomIds.includes(room.id))
  }

  const nextDay = () => {
    setCurrentDayIndex((prev) => (prev + 1) % DAYS.length)
  }

  const prevDay = () => {
    setCurrentDayIndex((prev) => (prev - 1 + DAYS.length) % DAYS.length)
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No time slots configured. Please add time slots first.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Day Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white shadow-lg"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevDay}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{currentDayLabel}</h2>
                <p className="text-sm text-white/80">Day {currentDayIndex + 1} of 7</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextDay}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Day Statistics */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <div className="text-2xl font-bold">{dayEntries.length}</div>
                <div className="text-xs text-white/80">Sessions</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <MapPin className="h-5 w-5" />
              <div>
                <div className="text-2xl font-bold">{rooms.length - new Set(dayEntries.map(e => e.room.id)).size}</div>
                <div className="text-xs text-white/80">Available</div>
              </div>
            </div>
            {dayEntries.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Users className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">
                    {dayEntries.reduce((total, entry) => total + (entry.course.enrollments?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-white/80">Students</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Day Navigation Dots */}
      <div className="flex justify-center space-x-2">
        {DAYS.map((day, index) => (
          <button
            key={index}
            onClick={() => setCurrentDayIndex(index)}
            className={`group relative transition-all ${
              index === currentDayIndex ? 'w-12' : 'w-3'
            }`}
          >
            <div className={`h-3 rounded-full transition-all ${
              index === currentDayIndex 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                : 'bg-gray-300 group-hover:bg-gray-400'
            }`} />
            {index === currentDayIndex && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 whitespace-nowrap">
                {DAY_LABELS[index]}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Time Slots for Current Day */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDayIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {timeSlots.map((timeSlot, index) => {
            const slotEntries = getEntriesForTimeSlot(timeSlot.id)
            const availableRooms = getAvailableRooms(timeSlot.id)
            
            return (
              <motion.div
                key={timeSlot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{formatTime(timeSlot.start)} - {formatTime(timeSlot.end)}</div>
                          <div className="text-sm font-normal text-muted-foreground">Time Slot {index + 1}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold">{slotEntries.length} sessions</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                          <MapPin className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-semibold">{availableRooms.length} available</span>
                        </div>
                        {slotEntries.length > 0 && (
                          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold">
                              {slotEntries.reduce((total, entry) => total + (entry.course.enrollments?.length || 0), 0)} students
                            </span>
                          </div>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {slotEntries.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {slotEntries.map((entry) => {
                          const colorClass = getDepartmentColor(entry.course.semester.program.department)
                          const enrollmentCount = entry.course.enrollments?.length || 0
                          const capacityInfo = getCapacityInfo(enrollmentCount, entry.room)
                          
                          return (
                            <motion.div
                              key={entry.id}
                              whileHover={{ y: -4, scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 h-full group">
                                {/* Gradient Top Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                                  entry.course.type === 'LAB' 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                }`} />
                                
                                <CardContent className="p-5 pt-6">
                                  <div className="space-y-4">
                                    {/* Header with Course Name and Type */}
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-1">
                                          {entry.course.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs font-semibold">
                                            {entry.course.code || 'No code'}
                                          </Badge>
                                          <Badge 
                                            variant={entry.course.type === 'LAB' ? 'secondary' : 'default'}
                                            className={`text-xs font-bold ${
                                              entry.course.type === 'LAB'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
                                            }`}
                                          >
                                            {entry.course.type}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 gap-2">
                                      {/* Faculty */}
                                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                                        <div className="p-1.5 bg-blue-100 rounded-md">
                                          <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-blue-600 font-medium">Faculty</p>
                                          <p className="text-sm font-semibold text-gray-900 truncate">{entry.faculty.name}</p>
                                        </div>
                                      </div>

                                      {/* Room */}
                                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                                        <div className="p-1.5 bg-orange-100 rounded-md">
                                          <MapPin className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-orange-600 font-medium">Room</p>
                                          <p className="text-sm font-semibold text-gray-900 truncate">{entry.room.name}</p>
                                        </div>
                                      </div>

                                      {/* Program */}
                                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                                        <div className="p-1.5 bg-purple-100 rounded-md">
                                          <BookOpen className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-purple-600 font-medium">Program</p>
                                          <p className="text-sm font-semibold text-gray-900 truncate">
                                            {entry.course.semester.program.name} - {getSemesterOrdinal(entry.course.semester.number)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Enrollment Section */}
                                    <div className="pt-3 border-t-2 space-y-3">
                                      {/* Enrollment Header */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 bg-green-100 rounded-md">
                                            <Users className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-600 font-medium">Students Enrolled</p>
                                            <p className="text-2xl font-bold text-gray-900">{enrollmentCount}</p>
                                          </div>
                                        </div>
                                        {enrollmentCount > 0 && (
                                          <div className="text-right">
                                            <p className="text-xs text-gray-600 font-medium">Capacity</p>
                                            <p className="text-lg font-bold text-gray-900">
                                              {enrollmentCount} / {capacityInfo.capacity}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {enrollmentCount > 0 && (
                                        <div className="space-y-2">
                                          {/* Utilization Progress */}
                                          <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-semibold text-gray-700">Utilization</span>
                                              <span className="text-sm font-bold text-gray-900">{capacityInfo.utilization}%</span>
                                            </div>
                                            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                              <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(capacityInfo.utilization, 100)}%` }}
                                                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                                className={`h-3 rounded-full shadow-sm ${
                                                  capacityInfo.status === 'perfect' ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500' :
                                                  capacityInfo.status === 'good' ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500' :
                                                  capacityInfo.status === 'overcrowded' ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500' :
                                                  capacityInfo.status === 'underutilized' ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-slate-500' :
                                                  'bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500'
                                                }`}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Status Badge */}
                                          <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs font-semibold text-gray-700">Status</span>
                                            <Badge className={`text-xs px-3 py-1 font-bold ${capacityInfo.statusColor} border-0 shadow-sm`}>
                                              {capacityInfo.status === 'perfect' && <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                                              {capacityInfo.status === 'overcrowded' && <AlertCircle className="h-3.5 w-3.5 mr-1.5" />}
                                              {capacityInfo.status === 'good' && <TrendingUp className="h-3.5 w-3.5 mr-1.5" />}
                                              {capacityInfo.status.charAt(0).toUpperCase() + capacityInfo.status.slice(1)}
                                            </Badge>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>

                                {/* Hover Glow Effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-lg ${
                                  entry.course.type === 'LAB'
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                }`} />
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No sessions scheduled for this time slot</p>
                      </div>
                    )}

                    {/* Available Rooms */}
                    {availableRooms.length > 0 && (
                      <div className="border-t-2 pt-4 bg-green-50/50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Available Rooms ({availableRooms.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {availableRooms.map((room) => (
                            <Badge 
                              key={room.id} 
                              variant="outline" 
                              className="text-xs bg-white text-green-700 border-green-300 hover:bg-green-50 transition-colors font-medium"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              {room.name} ({room.type})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}