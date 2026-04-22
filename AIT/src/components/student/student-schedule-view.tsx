'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface StudentScheduleData {
  student: {
    id: number
    regId: string
    regName: string
    program?: {
      name: string
      code: string
    }
    semester?: {
      number: number
    }
  }
  schedule: Record<string, ScheduleEntry[]>
  scheduleList: ScheduleEntry[]
  statistics: {
    totalCourses: number
    totalHours: number
    daysWithClasses: number
    conflicts: number
    crossSemesterCourses: number
  }
}

interface ScheduleEntry {
  id: number
  day: string
  isConflict: boolean
  conflictReason?: string
  course: {
    id: number
    name: string
    code: string
    type: string
    semester: {
      number: number
      program: {
        name: string
      }
    }
    faculty?: {
      name: string
    }
  }
  timeSlot: {
    start: string
    end: string
  }
  room: {
    name: string
  }
}

interface ConflictData {
  id: number
  conflictType: string
  severity: string
  title: string
  description: string
  affectedCourses: any[]
  timeSlotInfo: any
  resolutionStatus: string
  detectedAt: string
}

interface StudentScheduleViewProps {
  studentId: number
  onClose?: () => void
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export function StudentScheduleView({ studentId, onClose }: StudentScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<StudentScheduleData | null>(null)
  const [conflicts, setConflicts] = useState<ConflictData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchScheduleData = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/schedule`)
      const result = await response.json()
      
      if (result.success) {
        setScheduleData(result.data)
      } else {
        toast.error('Failed to fetch student schedule')
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
      toast.error('Failed to fetch student schedule')
    }
  }

  const fetchConflicts = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/conflicts`)
      const result = await response.json()
      
      if (result.success) {
        setConflicts(result.data.conflicts)
      } else {
        toast.error('Failed to fetch conflicts')
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error)
      toast.error('Failed to fetch conflicts')
    }
  }

  const refreshSchedule = async () => {
    setIsRefreshing(true)
    try {
      // Regenerate schedule from enrollments
      const response = await fetch(`/api/students/${studentId}/schedule`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success('Schedule refreshed successfully')
        await fetchScheduleData()
        await fetchConflicts()
      } else {
        toast.error('Failed to refresh schedule')
      }
    } catch (error) {
      console.error('Error refreshing schedule:', error)
      toast.error('Failed to refresh schedule')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchScheduleData(), fetchConflicts()])
      setIsLoading(false)
    }
    
    loadData()
  }, [studentId])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  const getConflictStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'text-green-600'
      case 'PENDING': return 'text-yellow-600'
      case 'ESCALATED': return 'text-red-600'
      case 'IGNORED': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading student schedule...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scheduleData) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Schedule Data</AlertTitle>
            <AlertDescription>
              Unable to load schedule data for this student.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const pendingConflicts = conflicts.filter(c => c.resolutionStatus === 'PENDING')
  const resolvedConflicts = conflicts.filter(c => c.resolutionStatus === 'RESOLVED')

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {scheduleData.student.regName} ({scheduleData.student.regId})
              </CardTitle>
              <CardDescription>
                {scheduleData.student.program?.name} - Semester {scheduleData.student.semester?.number}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSchedule}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{scheduleData.statistics.totalCourses}</div>
              <div className="text-sm text-muted-foreground">Total Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{scheduleData.statistics.totalHours}</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{scheduleData.statistics.daysWithClasses}</div>
              <div className="text-sm text-muted-foreground">Days with Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{scheduleData.statistics.crossSemesterCourses}</div>
              <div className="text-sm text-muted-foreground">Cross-Semester</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${scheduleData.statistics.conflicts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {scheduleData.statistics.conflicts}
              </div>
              <div className="text-sm text-muted-foreground">Conflicts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {pendingConflicts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Schedule Conflicts Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            This student has {pendingConflicts.length} unresolved schedule conflict(s) that require attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflicts ({conflicts.length})
          </TabsTrigger>
          <TabsTrigger value="courses">Course List</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4">
            {DAYS.map(day => {
              const daySchedule = scheduleData.schedule[day] || []
              return (
                <Card key={day}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                      {daySchedule.length > 0 && (
                        <Badge variant="secondary">{daySchedule.length} classes</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {daySchedule.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No classes scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {daySchedule
                          .sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start))
                          .map((entry, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${
                                entry.isConflict 
                                  ? 'border-red-200 bg-red-50' 
                                  : entry.course.semester.number !== scheduleData.student.semester?.number
                                    ? 'border-orange-200 bg-orange-50'
                                    : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">{entry.course.name}</h4>
                                    <Badge variant="outline">{entry.course.code}</Badge>
                                    <Badge variant={entry.course.type === 'LAB' ? 'default' : 'secondary'}>
                                      {entry.course.type}
                                    </Badge>
                                    {entry.course.semester.number !== scheduleData.student.semester?.number && (
                                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                                        Semester {entry.course.semester.number}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {entry.timeSlot.start} - {entry.timeSlot.end}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {entry.room.name}
                                    </div>
                                    {entry.course.faculty && (
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {entry.course.faculty.name}
                                      </div>
                                    )}
                                  </div>
                                  {entry.isConflict && entry.conflictReason && (
                                    <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                                      <AlertTriangle className="h-3 w-3" />
                                      {entry.conflictReason}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {entry.isConflict ? (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  ) : (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          {conflicts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conflicts Detected</h3>
                  <p className="text-muted-foreground">
                    This student's schedule is conflict-free.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <Card key={conflict.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {conflict.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(conflict.severity)}>
                          {conflict.severity}
                        </Badge>
                        <Badge variant="outline" className={getConflictStatusColor(conflict.resolutionStatus)}>
                          {conflict.resolutionStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{conflict.description}</p>
                    
                    {conflict.affectedCourses && conflict.affectedCourses.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Affected Courses:</h4>
                        <div className="flex flex-wrap gap-2">
                          {conflict.affectedCourses.map((course, index) => (
                            <Badge key={index} variant="outline">
                              {course.code || course.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      Detected: {new Date(conflict.detectedAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4">
            {scheduleData.scheduleList
              .reduce((acc, entry) => {
                if (!acc.find(item => item.course.id === entry.course.id)) {
                  acc.push(entry)
                }
                return acc
              }, [] as ScheduleEntry[])
              .map((entry) => (
                <Card key={entry.course.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{entry.course.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {entry.course.code} • {entry.course.type} • 
                          Semester {entry.course.semester.number} • 
                          {entry.course.semester.program.name}
                        </p>
                        {entry.course.faculty && (
                          <p className="text-sm text-muted-foreground">
                            Faculty: {entry.course.faculty.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.course.semester.number !== scheduleData.student.semester?.number && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Cross-Semester
                          </Badge>
                        )}
                        {entry.isConflict ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}