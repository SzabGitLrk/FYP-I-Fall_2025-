"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ExportUtils } from "@/lib/export-utils"
import { toastUtils } from "@/lib/toast-utils"
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Download,
  BarChart3,
  Activity
} from "lucide-react"

interface TimetableEntry {
  id: number
  day: string
  course: {
    id: number
    name: string
    code: string | null
    type: string
    semester: {
      id: number
      number: number
      program: {
        id: number
        name: string
      }
    }
  }
  faculty: {
    id: number
    name: string
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

interface FacultyWorkload {
  name: string
  courses: number
  sessions: number
  totalHours: number
  utilizationPercentage: number
}

interface RoomUtilization {
  name: string
  type: string
  occupiedSlots: number
  totalSlots: number
  utilizationPercentage: number
}

interface AnalyticsDashboardProps {
  entries: TimetableEntry[]
  timeSlots: TimeSlot[]
}

export function AnalyticsDashboard({ entries, timeSlots }: AnalyticsDashboardProps) {
  const [facultyWorkload, setFacultyWorkload] = useState<FacultyWorkload[]>([])
  const [roomUtilization, setRoomUtilization] = useState<RoomUtilization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateAnalytics()
  }, [entries, timeSlots])

  const calculateAnalytics = () => {
    setLoading(true)
    
    // Calculate faculty workload
    const facultyMap = new Map<string, {
      name: string
      courses: Set<string>
      sessions: number
      totalHours: number
    }>()

    entries.forEach(entry => {
      const facultyName = entry.faculty.name
      if (!facultyMap.has(facultyName)) {
        facultyMap.set(facultyName, {
          name: facultyName,
          courses: new Set(),
          sessions: 0,
          totalHours: 0
        })
      }
      
      const faculty = facultyMap.get(facultyName)!
      faculty.courses.add(entry.course.name)
      faculty.sessions += 1
      faculty.totalHours += 1 // Assuming 1 hour per session
    })

    const facultyWorkloadData = Array.from(facultyMap.values()).map(faculty => ({
      name: faculty.name,
      courses: faculty.courses.size,
      sessions: faculty.sessions,
      totalHours: faculty.totalHours,
      utilizationPercentage: (faculty.totalHours / 40) * 100 // Assuming 40 hours full load
    }))

    // Calculate room utilization
    const roomMap = new Map<string, {
      name: string
      type: string
      occupiedSlots: number
    }>()

    const totalPossibleSlots = 7 * timeSlots.length

    entries.forEach(entry => {
      const roomName = entry.room.name
      if (!roomMap.has(roomName)) {
        roomMap.set(roomName, {
          name: roomName,
          type: entry.room.type,
          occupiedSlots: 0
        })
      }
      
      roomMap.get(roomName)!.occupiedSlots += 1
    })

    const roomUtilizationData = Array.from(roomMap.values()).map(room => ({
      name: room.name,
      type: room.type,
      occupiedSlots: room.occupiedSlots,
      totalSlots: totalPossibleSlots,
      utilizationPercentage: (room.occupiedSlots / totalPossibleSlots) * 100
    }))

    setFacultyWorkload(facultyWorkloadData.sort((a, b) => b.totalHours - a.totalHours))
    setRoomUtilization(roomUtilizationData.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage))
    setLoading(false)
  }

  const handleExportFacultyWorkload = async () => {
    try {
      await ExportUtils.exportFacultyWorkloadPDF(entries)
    } catch (error) {
      console.error('Faculty workload export failed:', error)
      toastUtils.error('Export Failed', 'Failed to export faculty workload report.')
    }
  }

  const handleExportRoomUtilization = async () => {
    try {
      await ExportUtils.exportRoomUtilizationPDF(entries, timeSlots)
    } catch (error) {
      console.error('Room utilization export failed:', error)
      toastUtils.error('Export Failed', 'Failed to export room utilization report.')
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
        <p className="text-gray-600">Generate a timetable to view analytics and reports.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facultyWorkload.length}</div>
            <p className="text-xs text-muted-foreground">
              Active teaching staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Used</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomUtilization.length}</div>
            <p className="text-xs text-muted-foreground">
              Out of available rooms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Faculty Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facultyWorkload.length > 0 
                ? (facultyWorkload.reduce((sum, f) => sum + f.totalHours, 0) / facultyWorkload.length).toFixed(1)
                : '0'
              } hrs
            </div>
            <p className="text-xs text-muted-foreground">
              Average teaching hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Room Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roomUtilization.length > 0 
                ? (roomUtilization.reduce((sum, r) => sum + r.utilizationPercentage, 0) / roomUtilization.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average room utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Workload */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Faculty Workload Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Teaching load distribution across faculty members
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportFacultyWorkload}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton type="table" rows={5} cols={5} />
          ) : (
            <div className="space-y-4">
              {facultyWorkload.slice(0, 10).map((faculty, index) => (
                <div key={faculty.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{faculty.name}</div>
                    <div className="text-sm text-gray-600">
                      {faculty.courses} courses • {faculty.sessions} sessions
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{faculty.totalHours} hrs</div>
                      <div className="text-sm text-gray-600">
                        {faculty.utilizationPercentage.toFixed(1)}% load
                      </div>
                    </div>
                    <Badge 
                      variant={
                        faculty.utilizationPercentage > 80 ? "destructive" :
                        faculty.utilizationPercentage > 60 ? "default" : "secondary"
                      }
                    >
                      {faculty.utilizationPercentage > 80 ? "High" :
                       faculty.utilizationPercentage > 60 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                </div>
              ))}
              {facultyWorkload.length > 10 && (
                <p className="text-sm text-gray-600 text-center">
                  Showing top 10 faculty members. Export full report for complete data.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Utilization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Room Utilization Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Usage patterns and efficiency across all rooms
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportRoomUtilization}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton type="table" rows={5} cols={4} />
          ) : (
            <div className="space-y-4">
              {roomUtilization.slice(0, 10).map((room, index) => (
                <div key={room.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-gray-600">
                      {room.type} • {room.occupiedSlots}/{room.totalSlots} slots
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{room.utilizationPercentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">utilization</div>
                    </div>
                    <Badge 
                      variant={
                        room.utilizationPercentage > 70 ? "default" :
                        room.utilizationPercentage > 40 ? "secondary" : "outline"
                      }
                    >
                      {room.utilizationPercentage > 70 ? "High" :
                       room.utilizationPercentage > 40 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                </div>
              ))}
              {roomUtilization.length > 10 && (
                <p className="text-sm text-gray-600 text-center">
                  Showing top 10 rooms. Export full report for complete data.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}