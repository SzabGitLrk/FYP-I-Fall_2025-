"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  MapPin,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Download,
  Filter,
  Grid3x3,
  List
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
}

interface CourseSchedule {
  id: string
  courseCode: string
  courseName: string
  facultyName: string
  room: string
  studentCount: number
  capacity: number
  day: string
  timeSlot: TimeSlot
  color?: string
  department?: string
}

interface TimetableViewProps {
  schedules: CourseSchedule[]
  days?: string[]
  timeSlots?: TimeSlot[]
  onCourseClick?: (schedule: CourseSchedule) => void
  viewMode?: "grid" | "list"
}

const DEPARTMENT_COLORS = {
  CS: "from-blue-500 to-cyan-500",
  EE: "from-purple-500 to-pink-500",
  ME: "from-emerald-500 to-teal-500",
  CE: "from-orange-500 to-red-500",
  default: "from-slate-500 to-slate-600"
}

function CourseCard({ schedule, onClick }: { schedule: CourseSchedule; onClick?: () => void }) {
  const capacityPercentage = (schedule.studentCount / schedule.capacity) * 100
  const departmentColor = DEPARTMENT_COLORS[schedule.department as keyof typeof DEPARTMENT_COLORS] || DEPARTMENT_COLORS.default

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={onClick}
            className="group relative h-full min-h-[80px] cursor-pointer"
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br rounded-lg opacity-10 group-hover:opacity-20 transition-opacity",
              departmentColor
            )} />
            <div className="relative h-full p-3 rounded-lg border-2 border-transparent group-hover:border-primary/20 transition-all bg-white shadow-sm group-hover:shadow-md">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {schedule.courseCode}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {schedule.courseName}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2 text-xs",
                      capacityPercentage > 90 && "bg-red-100 text-red-700",
                      capacityPercentage > 70 && capacityPercentage <= 90 && "bg-amber-100 text-amber-700",
                      capacityPercentage <= 70 && "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {schedule.studentCount}/{schedule.capacity}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <GraduationCap className="h-3 w-3 mr-1.5" />
                    <span className="truncate">{schedule.facultyName}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5" />
                    <span>{schedule.room}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1.5" />
                    <span>{schedule.timeSlot.startTime} - {schedule.timeSlot.endTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold">{schedule.courseCode} - {schedule.courseName}</p>
            </div>
            <div className="space-y-1 text-xs">
              <p><strong>Faculty:</strong> {schedule.facultyName}</p>
              <p><strong>Room:</strong> {schedule.room}</p>
              <p><strong>Time:</strong> {schedule.timeSlot.startTime} - {schedule.timeSlot.endTime}</p>
              <p><strong>Students:</strong> {schedule.studentCount} / {schedule.capacity}</p>
              {schedule.department && <p><strong>Department:</strong> {schedule.department}</p>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ImprovedTimetableView({
  schedules,
  days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  timeSlots = [],
  onCourseClick,
  viewMode: initialViewMode = "grid"
}: TimetableViewProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">(initialViewMode)
  const [selectedDay, setSelectedDay] = React.useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter(schedule => {
      if (selectedDay !== "all" && schedule.day !== selectedDay) return false
      if (selectedDepartment !== "all" && schedule.department !== selectedDepartment) return false
      return true
    })
  }, [schedules, selectedDay, selectedDepartment])

  const departments = React.useMemo(() => {
    const depts = new Set(schedules.map(s => s.department).filter(Boolean))
    return Array.from(depts)
  }, [schedules])

  const toolbar = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {viewMode === "list" && (
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {days.map(day => (
                <SelectItem key={day} value={day}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {departments.length > 0 && (
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <Grid3x3 className="h-4 w-4 mr-2" />
          Grid
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {toolbar}

        {/* List View */}
        <div className="space-y-2">
          {filteredSchedules.map((schedule, index) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCourseClick?.(schedule)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={cn(
                    "w-1 h-16 rounded-full bg-gradient-to-b",
                    DEPARTMENT_COLORS[schedule.department as keyof typeof DEPARTMENT_COLORS] || DEPARTMENT_COLORS.default
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-foreground">{schedule.courseCode}</h4>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{schedule.courseName}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {schedule.day}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        {schedule.timeSlot.startTime} - {schedule.timeSlot.endTime}
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                        {schedule.facultyName}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        {schedule.room}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        {schedule.studentCount}/{schedule.capacity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // Grid View
  return (
    <div className="space-y-4">
      {toolbar}

      {/* Grid View */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider w-32">
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {timeSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 bg-slate-50/50">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div>{slot.startTime}</div>
                          <div className="text-xs text-muted-foreground">{slot.endTime}</div>
                        </div>
                      </div>
                    </td>
                    {days.map(day => {
                      const daySchedules = filteredSchedules.filter(
                        s => s.day === day && s.timeSlot.id === slot.id
                      )
                      return (
                        <td key={day} className="px-2 py-2 align-top">
                          <div className="space-y-2">
                            {daySchedules.map(schedule => (
                              <CourseCard
                                key={schedule.id}
                                schedule={schedule}
                                onClick={() => onCourseClick?.(schedule)}
                              />
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
