"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { 
  BookOpen, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface TimetableEntry {
  id: number
  day: string
  course: {
    id: number
    name: string
    code: string
    type: string
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
  room: {
    id: number
    name: string
    type: string
  }
  timeslot: {
    id: number
    start: string
    end: string
  }
}

interface TimeSlot {
  id: number
  start: string
  end: string
}

interface TimetableProgramViewProps {
  entries: TimetableEntry[]
  timeSlots: TimeSlot[]
}

interface ProgramData {
  id: number
  name: string
  semesters: {
    [semesterNumber: number]: {
      id: number
      courses: TimetableEntry[]
    }
  }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export function TimetableProgramView({ entries, timeSlots }: TimetableProgramViewProps) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set())

  // Group entries by program and semester
  const programData: { [programId: number]: ProgramData } = {}
  
  entries.forEach(entry => {
    const programId = entry.course.semester.program.id
    const semesterNumber = entry.course.semester.number
    
    if (!programData[programId]) {
      programData[programId] = {
        id: programId,
        name: entry.course.semester.program.name,
        semesters: {}
      }
    }
    
    if (!programData[programId].semesters[semesterNumber]) {
      programData[programId].semesters[semesterNumber] = {
        id: entry.course.semester.id,
        courses: []
      }
    }
    
    programData[programId].semesters[semesterNumber].courses.push(entry)
  })

  const programs = Object.values(programData)

  const toggleProgramExpansion = (programId: number) => {
    const newExpanded = new Set(expandedPrograms)
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId)
    } else {
      newExpanded.add(programId)
    }
    setExpandedPrograms(newExpanded)
  }

  const toggleSemesterExpansion = (programId: number, semesterNumber: number) => {
    const key = `${programId}-${semesterNumber}`
    const newExpanded = new Set(expandedSemesters)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedSemesters(newExpanded)
  }

  const getTimeSlotLabel = (timeSlotId: number) => {
    const slot = timeSlots.find(ts => ts.id === timeSlotId)
    return slot ? `${slot.start}-${slot.end}` : 'Unknown'
  }

  const getCourseTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'LAB': return 'bg-purple-100 text-purple-800'
      case 'THEORY': return 'bg-blue-100 text-blue-800'
      case 'TUTORIAL': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDayColor = (day: string) => {
    const colors = {
      'MONDAY': 'bg-red-50 border-red-200',
      'TUESDAY': 'bg-orange-50 border-orange-200',
      'WEDNESDAY': 'bg-yellow-50 border-yellow-200',
      'THURSDAY': 'bg-green-50 border-green-200',
      'FRIDAY': 'bg-blue-50 border-blue-200',
      'SATURDAY': 'bg-indigo-50 border-indigo-200',
      'SUNDAY': 'bg-purple-50 border-purple-200'
    }
    return colors[day as keyof typeof colors] || 'bg-gray-50 border-gray-200'
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Data</h3>
        <p className="text-gray-600">Generate a timetable to view program-wise schedules.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Program View Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Program-wise Timetable</h3>
          <Badge variant="outline">{programs.length} program{programs.length !== 1 ? 's' : ''}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allProgramIds = new Set(programs.map(p => p.id))
              const allSemesterKeys = new Set<string>()
              programs.forEach(program => {
                Object.keys(program.semesters).forEach(semNum => {
                  allSemesterKeys.add(`${program.id}-${semNum}`)
                })
              })
              setExpandedPrograms(allProgramIds)
              setExpandedSemesters(allSemesterKeys)
            }}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExpandedPrograms(new Set())
              setExpandedSemesters(new Set())
            }}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {programs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{programs.length}</div>
                  <div className="text-sm text-gray-600">Program{programs.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {programs.reduce((sum, p) => sum + Object.keys(p.semesters).length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Semesters</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {programs.reduce((sum, p) => 
                      sum + Object.values(p.semesters).reduce((semSum, sem) => semSum + sem.courses.length, 0), 0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(
                      programs.flatMap(p => 
                        Object.values(p.semesters).flatMap(sem => 
                          sem.courses.map(c => c.course.faculty?.id).filter(Boolean)
                        )
                      )
                    ).size}
                  </div>
                  <div className="text-sm text-gray-600">Faculty</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Programs List */}
      <div className="space-y-4">
        {programs.map(program => {
          const isExpanded = expandedPrograms.has(program.id)
          const semesterCount = Object.keys(program.semesters).length
          const totalCourses = Object.values(program.semesters).reduce((sum, sem) => sum + sem.courses.length, 0)
          
          return (
            <Card key={program.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleProgramExpansion(program.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <CardDescription>
                        {semesterCount} semester{semesterCount !== 1 ? 's' : ''} • {totalCourses} course{totalCourses !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{totalCourses} sessions</Badge>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {Object.entries(program.semesters)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([semesterNumber, semesterData]) => {
                        const semesterKey = `${program.id}-${semesterNumber}`
                        const isSemesterExpanded = expandedSemesters.has(semesterKey)
                        
                        // Group courses by day
                        const coursesByDay: { [day: string]: TimetableEntry[] } = {}
                        semesterData.courses.forEach(course => {
                          if (!coursesByDay[course.day]) {
                            coursesByDay[course.day] = []
                          }
                          coursesByDay[course.day].push(course)
                        })
                        
                        return (
                          <div key={semesterNumber} className="border rounded-lg overflow-hidden">
                            <div 
                              className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => toggleSemesterExpansion(program.id, parseInt(semesterNumber))}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {isSemesterExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                  <Calendar className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">Semester {semesterNumber}</span>
                                </div>
                                <Badge variant="outline">{semesterData.courses.length} courses</Badge>
                              </div>
                            </div>
                            
                            {isSemesterExpanded && (
                              <div className="p-4">
                                <div className="grid gap-4">
                                  {DAYS.map(day => {
                                    const dayCourses = coursesByDay[day] || []
                                    if (dayCourses.length === 0) return null
                                    
                                    // Sort courses by time slot
                                    const sortedCourses = dayCourses.sort((a, b) => {
                                      const timeA = timeSlots.find(ts => ts.id === a.timeslot.id)?.start || ''
                                      const timeB = timeSlots.find(ts => ts.id === b.timeslot.id)?.start || ''
                                      return timeA.localeCompare(timeB)
                                    })
                                    
                                    return (
                                      <div key={day} className={`rounded-lg border p-4 ${getDayColor(day)}`}>
                                        <h4 className="font-semibold mb-3 text-gray-800">{day}</h4>
                                        <div className="space-y-2">
                                          {sortedCourses.map(course => (
                                            <div key={course.id} className="bg-white rounded-lg p-3 shadow-sm border">
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                  <div className="flex items-center space-x-2 mb-2">
                                                    <h5 className="font-medium text-gray-900">{course.course.name}</h5>
                                                    <Badge variant="outline" className="text-xs">
                                                      {course.course.code}
                                                    </Badge>
                                                    <Badge className={getCourseTypeColor(course.course.type)}>
                                                      {course.course.type}
                                                    </Badge>
                                                  </div>
                                                  <div className="text-sm text-gray-600 space-y-1">
                                                    <div className="flex items-center space-x-4">
                                                      <div className="flex items-center space-x-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{getTimeSlotLabel(course.timeslot.id)}</span>
                                                      </div>
                                                      <div className="flex items-center space-x-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{course.room.name}</span>
                                                      </div>
                                                      {course.course.faculty && (
                                                        <div className="flex items-center space-x-1">
                                                          <User className="h-3 w-3" />
                                                          <span>{course.course.faculty.name}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}