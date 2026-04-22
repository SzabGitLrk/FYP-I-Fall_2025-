'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, GraduationCap, Users, School, Clock, CalendarDays, Building2, UserCheck, AlertCircle, CheckCircle2, TrendingUp, Activity, BarChart3 } from "lucide-react"
import { ImprovedDashboardCards } from "@/components/dashboard/dashboard-cards-improved"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardSkeleton } from "@/components/admin/dashboard-skeletons"
import { SimpleSplashScreen } from "@/components/admin/simple-splash-screen"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    students: 0,
    courses: 0,
    faculty: 0,
    rooms: 0,
    departments: 0,
    programs: 0,
    timetableEntries: 0,
    activeEnrollments: 0,
    timeSlots: 0,
    scheduledCourses: 0,
    recentStudents: [] as any[],
    recentCourses: [] as any[],
    roomsByType: [] as any[],
    isConnected: true,
    isLoading: true
  })
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Initializing dashboard...')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingMessage('Checking database connection...')
        setLoadingProgress(20)

        // Fetch dashboard data from API
        const response = await fetch('/api/admin/dashboard-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        setLoadingMessage('Fetching dashboard data...')
        setLoadingProgress(50)

        const data = await response.json()
        
        if (data.success) {
          setLoadingMessage('Processing data...')
          setLoadingProgress(80)

          setDashboardData({
            students: data.data.students || 0,
            courses: data.data.courses || 0,
            faculty: data.data.faculty || 0,
            rooms: data.data.rooms || 0,
            departments: data.data.departments || 0,
            programs: data.data.programs || 0,
            timetableEntries: data.data.timetableEntries || 0,
            activeEnrollments: data.data.activeEnrollments || 0,
            timeSlots: data.data.timeSlots || 0,
            scheduledCourses: data.data.scheduledCourses || 0,
            recentStudents: data.data.recentStudents || [],
            recentCourses: data.data.recentCourses || [],
            roomsByType: data.data.roomsByType || [],
            isConnected: true,
            isLoading: false
          })

          setLoadingMessage('Dashboard ready!')
          setLoadingProgress(100)
          toast.success('Dashboard loaded successfully')
        } else {
          throw new Error(data.error || 'Failed to fetch dashboard data')
        }
      } catch (error) {
        console.error('Database connection failed:', error)
        setHasError(true)
        setLoadingMessage('Using demo data (offline mode)')
        setLoadingProgress(100)
        
        // Use demo data when database is unavailable
        setDashboardData({
          students: 712,
          courses: 162,
          faculty: 45,
          rooms: 18,
          departments: 3,
          programs: 3,
          timetableEntries: 0,
          activeEnrollments: 3772,
          timeSlots: 6,
          scheduledCourses: 0,
          recentStudents: [],
          recentCourses: [],
          roomsByType: [
            { type: 'CLASSROOM', _count: 12 },
            { type: 'LAB', _count: 6 }
          ],
          isConnected: false,
          isLoading: false
        })
        
        toast.warning('Using demo data - database connection failed')
      }
    }

    // Simulate a slight delay for better UX
    setTimeout(() => {
      fetchDashboardData()
    }, 500)
  }, [])

  // Destructure for easier access
  const {
    students,
    courses,
    faculty,
    rooms,
    departments,
    programs,
    timetableEntries,
    activeEnrollments,
    timeSlots,
    scheduledCourses,
    recentStudents,
    recentCourses,
    roomsByType,
    isConnected,
    isLoading
  } = dashboardData

  const stats = {
    totalStudents: students,
    totalCourses: courses,
    totalFaculty: faculty,
    totalRooms: rooms,
    scheduledCourses,
    lastGenerated: timetableEntries > 0 ? 'Recently' : undefined
  }

  const scheduleProgress = courses > 0 ? Math.round((scheduledCourses / courses) * 100) : 0
  const enrollmentRate = students > 0 ? Math.round((activeEnrollments / (students * 5)) * 100) : 0

  return (
    <>
      {/* Splash Screen */}
      <SimpleSplashScreen
        isLoading={dashboardData.isLoading}
        message={loadingMessage}
        hasError={hasError}
        progress={loadingProgress}
      />

      {/* Dashboard Content */}
      {!dashboardData.isLoading && (
        <div className="space-y-6">
          {/* Improved Dashboard Cards */}
          <ImprovedDashboardCards stats={{
            totalStudents: students,
            totalCourses: courses,
            totalFaculty: faculty,
            totalRooms: rooms,
            scheduledCourses,
            lastGenerated: timetableEntries > 0 ? 'Recently' : undefined
          }} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Departments</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{departments}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Programs</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{programs}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">Enrollments</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{activeEnrollments}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Time Slots</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{timeSlots}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Scheduling Overview
                  </CardTitle>
                  <CardDescription>Current timetable generation status</CardDescription>
                </div>
                <Badge variant={scheduleProgress === 100 ? "default" : scheduleProgress > 0 ? "secondary" : "outline"}>
                  {scheduleProgress}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Courses Scheduled</span>
                  <span className="font-medium">{scheduledCourses} / {courses}</span>
                </div>
                <Progress value={scheduleProgress} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Student Enrollment Rate</span>
                  <span className="font-medium">{enrollmentRate}%</span>
                </div>
                <Progress value={enrollmentRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Scheduled: <span className="font-medium text-foreground">{scheduledCourses}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">Pending: <span className="font-medium text-foreground">{courses - scheduledCourses}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest additions to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">New Students</h4>
                    <div className="space-y-2">
                      {recentStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{student.regName}</p>
                              <p className="text-xs text-muted-foreground">{student.regId}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{student.program?.name || 'No Program'}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recentCourses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">New Courses</h4>
                    <div className="space-y-2">
                      {recentCourses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{course.name}</p>
                              <p className="text-xs text-muted-foreground">{course.code || 'No Code'}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{course.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/admin/programs" className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Manage Programs</p>
                    <p className="text-xs text-muted-foreground">Add or edit programs</p>
                  </div>
                </div>
              </a>

              <a href="/admin/courses" className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Manage Courses</p>
                    <p className="text-xs text-muted-foreground">Create and assign courses</p>
                  </div>
                </div>
              </a>

              <a href="/admin/timetable" className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Generate Timetable</p>
                    <p className="text-xs text-muted-foreground">Create schedule</p>
                  </div>
                </div>
              </a>

              <a href="/admin/rooms" className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <School className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Manage Rooms</p>
                    <p className="text-xs text-muted-foreground">View room assignments</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Resource Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resource Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Classrooms</span>
                  <span className="font-medium">{roomsByType.find(r => r.type === 'CLASSROOM')?._count || 0}</span>
                </div>
                <Progress value={(roomsByType.find(r => r.type === 'CLASSROOM')?._count || 0) / rooms * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Labs</span>
                  <span className="font-medium">{roomsByType.find(r => r.type === 'LAB')?._count || 0}</span>
                </div>
                <Progress value={(roomsByType.find(r => r.type === 'LAB')?._count || 0) / rooms * 100} className="h-2" />
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Faculty per Department</span>
                  <span className="font-medium">{departments > 0 ? Math.round(faculty / departments) : 0} avg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-green-500" : "bg-red-500"}>
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Offline Mode
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Timetable Status</span>
                <Badge variant={timetableEntries > 0 ? "default" : "secondary"}>
                  {timetableEntries > 0 ? `${timetableEntries} entries` : 'Not Generated'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Enrollments</span>
                <Badge variant="outline">{activeEnrollments}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      )}
    </>
  )
}