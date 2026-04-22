'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  AlertTriangle, 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  Search,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { StudentScheduleView } from '@/components/student/student-schedule-view'

interface CrossRegistrationStats {
  totalStudents: number
  studentsWithCrossRegistrations: number
  totalCrossRegistrations: number
  conflictsDetected: number
  studentsWithConflicts: number
  conflictsBySeverity: {
    CRITICAL: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
}

interface StudentConflict {
  id: number
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
  conflictType: string
  severity: string
  title: string
  description: string
  affectedCourses: any[]
  timeSlotInfo: any
  resolutionStatus: string
  detectedAt: string
}

interface CrossRegistrationData {
  studentId: number
  studentRegId: string
  studentName: string
  program: string
  semester: number
  crossSemesterCourses: Array<{
    courseId: number
    courseName: string
    courseCode: string
    courseSemester: number
    hasConflict: boolean
  }>
  conflictCount: number
}

export default function CrossRegistrationsPage() {
  const [stats, setStats] = useState<CrossRegistrationStats | null>(null)
  const [conflicts, setConflicts] = useState<StudentConflict[]>([])
  const [crossRegistrations, setCrossRegistrations] = useState<CrossRegistrationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch cross-registration statistics and conflicts
      const [conflictsResponse, enrollmentsResponse] = await Promise.all([
        fetch('/api/conflicts/summary'),
        fetch('/api/enrollments/cross-registrations')
      ])
      
      // For now, we'll simulate the data since the endpoints don't exist yet
      // In a real implementation, these would be proper API calls
      
      // Simulated stats
      setStats({
        totalStudents: 712,
        studentsWithCrossRegistrations: 89,
        totalCrossRegistrations: 156,
        conflictsDetected: 23,
        studentsWithConflicts: 18,
        conflictsBySeverity: {
          CRITICAL: 3,
          HIGH: 8,
          MEDIUM: 9,
          LOW: 3
        }
      })
      
      // Simulated conflicts data
      setConflicts([
        {
          id: 1,
          student: {
            id: 1,
            regId: '2024-CS-001',
            regName: 'John Doe',
            program: { name: 'Computer Science', code: 'BSCS' },
            semester: { number: 3 }
          },
          conflictType: 'SCHEDULING_CONFLICT',
          severity: 'HIGH',
          title: 'Schedule Conflict on Monday',
          description: 'Student has overlapping courses on Monday at 09:00-12:00',
          affectedCourses: [
            { id: 1, name: 'Data Structures', code: 'CS-201' },
            { id: 2, name: 'Database Systems', code: 'CS-301' }
          ],
          timeSlotInfo: {
            day: 'MONDAY',
            timeSlot: { start: '09:00', end: '12:00' }
          },
          resolutionStatus: 'PENDING',
          detectedAt: new Date().toISOString()
        }
      ])
      
      // Simulated cross-registration data
      setCrossRegistrations([
        {
          studentId: 1,
          studentRegId: '2024-CS-001',
          studentName: 'John Doe',
          program: 'Computer Science',
          semester: 3,
          crossSemesterCourses: [
            {
              courseId: 1,
              courseName: 'Advanced Programming',
              courseCode: 'CS-301',
              courseSemester: 4,
              hasConflict: true
            },
            {
              courseId: 2,
              courseName: 'Software Engineering',
              courseCode: 'CS-401',
              courseSemester: 5,
              hasConflict: false
            }
          ],
          conflictCount: 1
        }
      ])
      
    } catch (error) {
      console.error('Error fetching cross-registration data:', error)
      toast.error('Failed to fetch cross-registration data')
    } finally {
      setIsLoading(false)
    }
  }

  const generateCrossRegistrationReport = async () => {
    setIsGenerating(true)
    try {
      // This would call the cross-registration aware algorithm
      const response = await fetch('/api/timetable/cross-registration-analysis', {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Cross-registration analysis completed')
        await fetchData()
      } else {
        toast.error('Failed to generate cross-registration report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate cross-registration report')
    } finally {
      setIsGenerating(false)
    }
  }

  const resolveConflict = async (conflictId: number, action: string) => {
    try {
      const response = await fetch('/api/conflicts/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conflictId,
          resolutionAction: action,
          resolvedBy: 'Administrator'
        }),
      })
      
      if (response.ok) {
        toast.success('Conflict resolved successfully')
        await fetchData()
      } else {
        toast.error('Failed to resolve conflict')
      }
    } catch (error) {
      console.error('Error resolving conflict:', error)
      toast.error('Failed to resolve conflict')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredConflicts = conflicts.filter(conflict =>
    conflict.student.regId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conflict.student.regName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCrossRegistrations = crossRegistrations.filter(reg =>
    reg.studentRegId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  if (selectedStudentId) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedStudentId(null)}
            className="mb-4"
          >
            ← Back to Cross-Registrations
          </Button>
        </div>
        <StudentScheduleView
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cross-Registration Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage student cross-semester enrollments and conflicts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={generateCrossRegistrationReport}
            disabled={isGenerating}
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.studentsWithCrossRegistrations} with cross-registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cross-Registrations</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCrossRegistrations}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.studentsWithCrossRegistrations} students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Conflicts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.conflictsDetected}</div>
              <p className="text-xs text-muted-foreground">
                Affecting {stats.studentsWithConflicts} students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(((stats.studentsWithCrossRegistrations - stats.studentsWithConflicts) / stats.studentsWithCrossRegistrations) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Conflict-free cross-registrations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conflict Severity Breakdown */}
      {stats && stats.conflictsDetected > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Conflicts Require Attention</AlertTitle>
          <AlertDescription className="text-orange-700">
            <div className="flex gap-4 mt-2">
              <span>Critical: {stats.conflictsBySeverity.CRITICAL}</span>
              <span>High: {stats.conflictsBySeverity.HIGH}</span>
              <span>Medium: {stats.conflictsBySeverity.MEDIUM}</span>
              <span>Low: {stats.conflictsBySeverity.LOW}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student ID or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="conflicts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conflicts">
            Active Conflicts ({filteredConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="registrations">
            Cross-Registrations ({filteredCrossRegistrations.length})
          </TabsTrigger>
        </TabsList>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          {filteredConflicts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Conflicts</h3>
                  <p className="text-muted-foreground">
                    All cross-registrations are conflict-free.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredConflicts.map((conflict) => (
                <Card key={conflict.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          {conflict.title}
                        </CardTitle>
                        <CardDescription>
                          {conflict.student.regId} - {conflict.student.regName} 
                          ({conflict.student.program?.name} - Semester {conflict.student.semester?.number})
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(conflict.severity)}>
                          {conflict.severity}
                        </Badge>
                        <Badge variant="outline">
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
                              {course.code} - {course.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Detected: {new Date(conflict.detectedAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudentId(conflict.student.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Schedule
                        </Button>
                        {conflict.resolutionStatus === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveConflict(conflict.id, 'IGNORE_CONFLICT')}
                            >
                              Ignore
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => resolveConflict(conflict.id, 'ESCALATE_CONFLICT')}
                            >
                              Escalate
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cross-Registrations Tab */}
        <TabsContent value="registrations" className="space-y-4">
          <div className="space-y-4">
            {filteredCrossRegistrations.map((registration) => (
              <Card key={registration.studentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{registration.studentName}</CardTitle>
                      <CardDescription>
                        {registration.studentRegId} - {registration.program} - Semester {registration.semester}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {registration.crossSemesterCourses.length} Cross-Semester Courses
                      </Badge>
                      {registration.conflictCount > 0 && (
                        <Badge variant="destructive">
                          {registration.conflictCount} Conflicts
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {registration.crossSemesterCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{course.courseCode}</span> - {course.courseName}
                          <span className="text-sm text-muted-foreground ml-2">
                            (Semester {course.courseSemester})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.hasConflict ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStudentId(registration.studentId)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Schedule
                    </Button>
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