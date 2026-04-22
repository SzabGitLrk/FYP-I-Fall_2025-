"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImprovedTable } from "@/components/ui/table-improved"
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-states"
import { TimeSlotForm } from "@/components/forms/timeslot-form"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { Plus, Clock, Calendar, BookOpen, Edit, Trash2, CheckCircle2, TrendingUp, Activity, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"

interface Course {
  id: number
  name: string
  code: string
  semester: {
    number: number
    program: {
      name: string
    }
  }
}

interface Room {
  id: number
  name: string
  type: string
}

interface TimetableEntry {
  id: number
  day: string
  course: Course
  room: Room
}

interface TimeSlot {
  id: number
  start: string
  end: string
  createdAt: string
  timetable: TimetableEntry[]
}

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null)
  const [deletingTimeSlot, setDeletingTimeSlot] = useState<TimeSlot | null>(null)

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch('/api/timeslots')
      const result = await response.json()
      
      if (result.success) {
        setTimeSlots(result.data)
      } else {
        toast.error('Failed to fetch time slots')
      }
    } catch (error) {
      toast.error('Failed to fetch time slots')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTimeSlot) return
    
    try {
      const response = await fetch(`/api/timeslots/${deletingTimeSlot.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Time slot deleted successfully')
        fetchTimeSlots()
      } else {
        toast.error(result.error || 'Failed to delete time slot')
      }
    } catch (error) {
      toast.error('Failed to delete time slot')
    }
  }

  useEffect(() => {
    fetchTimeSlots()
  }, [])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const calculateDuration = (start: string, end: string) => {
    try {
      const startTime = new Date(`1970-01-01T${start}:00`)
      const endTime = new Date(`1970-01-01T${end}:00`)
      const diffMs = endTime.getTime() - startTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      const hours = Math.floor(diffHours)
      const minutes = Math.round((diffHours - hours) * 60)
      
      if (hours === 0) return `${minutes}m`
      if (minutes === 0) return `${hours}h`
      return `${hours}h ${minutes}m`
    } catch {
      return ""
    }
  }

  const columns: ColumnDef<TimeSlot>[] = [
    {
      accessorKey: "start",
      header: "Time Slot",
      cell: ({ row }) => {
        const timeSlot = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-base">
                {formatTime(timeSlot.start)} - {formatTime(timeSlot.end)}
              </div>
              <div className="text-sm text-muted-foreground">
                {calculateDuration(timeSlot.start, timeSlot.end)} duration
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "timetable",
      header: "Usage",
      cell: ({ row }) => {
        const timetable = row.getValue("timetable") as TimetableEntry[]
        const uniqueDays = new Set(timetable.map(entry => entry.day)).size
        
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-base">{timetable.length} sessions</div>
              <div className="text-sm text-muted-foreground">
                {uniqueDays > 0 ? `${uniqueDays} days/week` : 'Not used'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "courses",
      header: "Courses",
      cell: ({ row }) => {
        const timetable = row.getValue("timetable") as TimetableEntry[]
        const uniqueCourses = new Set(timetable.map(entry => entry.course.id)).size
        
        if (uniqueCourses === 0) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground italic">
              <BookOpen className="h-4 w-4" />
              <span>No courses scheduled</span>
            </div>
          )
        }
        
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">{uniqueCourses} courses</div>
              {timetable.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {timetable.slice(0, 2).map((entry) => (
                    <div key={entry.id} className="truncate">
                      {entry.course.code} - {entry.room.name}
                    </div>
                  ))}
                  {timetable.length > 2 && (
                    <div className="text-xs text-muted-foreground/70">
                      +{timetable.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const timetable = row.getValue("timetable") as TimetableEntry[]
        
        if (timetable.length === 0) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  Available
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>No classes scheduled in this time slot</p>
              </TooltipContent>
            </Tooltip>
          )
        }
        
        const uniqueDays = new Set(timetable.map(entry => entry.day)).size
        if (uniqueDays >= 5) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="gap-1">
                  <Activity className="h-3 w-3" />
                  Fully Booked
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Scheduled on 5+ days per week - maximum utilization</p>
              </TooltipContent>
            </Tooltip>
          )
        } else if (uniqueDays >= 3) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1 bg-orange-500 text-white">
                  <TrendingUp className="h-3 w-3" />
                  Busy
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Scheduled on 3-4 days per week - high utilization</p>
              </TooltipContent>
            </Tooltip>
          )
        } else {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default" className="gap-1 bg-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Scheduled on 1-2 days per week - moderate utilization</p>
              </TooltipContent>
            </Tooltip>
          )
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return (
          <div className="text-sm">
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-muted-foreground text-xs">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const timeSlot = row.original
        const hasSchedules = timeSlot.timetable.length > 0
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingTimeSlot(timeSlot)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingTimeSlot(timeSlot)}
              disabled={hasSchedules}
              className={hasSchedules ? '' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalSlots = timeSlots.length
    const activeSlots = timeSlots.filter(slot => slot.timetable.length > 0).length
    const availableSlots = totalSlots - activeSlots
    const totalSessions = timeSlots.reduce((acc, slot) => acc + slot.timetable.length, 0)
    const uniqueCourses = new Set(
      timeSlots.flatMap(slot => slot.timetable.map(entry => entry.course.id))
    ).size
    const utilizationRate = totalSlots > 0 ? Math.round((activeSlots / totalSlots) * 100) : 0
    
    return {
      totalSlots,
      activeSlots,
      availableSlots,
      totalSessions,
      uniqueCourses,
      utilizationRate
    }
  }, [timeSlots])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading time slots..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Time Slots</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage daily time blocks for course scheduling and timetable organization
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              size="lg"
              className="bg-white text-cyan-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Time Slot
            </Button>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-cyan-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Slots</p>
                  <p className="text-4xl font-bold">{statistics.totalSlots}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active</p>
                  <p className="text-4xl font-bold">{statistics.activeSlots}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-orange-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Available</p>
                  <p className="text-4xl font-bold">{statistics.availableSlots}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Sessions</p>
                  <p className="text-4xl font-bold">{statistics.totalSessions}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Courses</p>
                  <p className="text-4xl font-bold">{statistics.uniqueCourses}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Time Slot Management
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Configure time blocks for course scheduling. {statistics.utilizationRate}% utilization rate.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {statistics.totalSlots} Slots
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Activity className="h-3 w-3 mr-1" />
                  {statistics.totalSessions} Sessions
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={timeSlots}
              searchKey="start"
              searchPlaceholder="Search time slots..."
            />
          </CardContent>
        </Card>
      </motion.div>

      <TimeSlotForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={fetchTimeSlots}
      />

      <TimeSlotForm
        open={!!editingTimeSlot}
        onOpenChange={(open) => !open && setEditingTimeSlot(null)}
        timeSlot={editingTimeSlot || undefined}
        onSuccess={fetchTimeSlots}
      />

      <DeleteDialog
        open={!!deletingTimeSlot}
        onOpenChange={(open) => !open && setDeletingTimeSlot(null)}
        title="Delete Time Slot"
        description={`Are you sure you want to delete the time slot "${deletingTimeSlot ? formatTime(deletingTimeSlot.start) + ' - ' + formatTime(deletingTimeSlot.end) : ''}"? ${
          deletingTimeSlot?.timetable.length ? 
          'This time slot is being used in the timetable and cannot be deleted. Please remove it from the timetable first.' :
          'This action cannot be undone.'
        }`}
        onConfirm={handleDelete}
      />
    </div>
  )
}