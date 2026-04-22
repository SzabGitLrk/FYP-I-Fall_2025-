"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Users,
  Monitor,
  Calendar,
  Clock,
  Building,
  Layers,
  Edit,
  X,
  CheckCircle2,
  XCircle,
  School,
  FlaskConical,
  Lightbulb,
  Volume2,
  Accessibility,
  TrendingUp,
  Target,
  Info,
  Wifi,
  Settings
} from "lucide-react"
import { motion } from "framer-motion"
import { RoomType } from "@/lib/types"

interface Course {
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
  timeslot: TimeSlot
}

interface RoomEnhancement {
  building?: string
  floor?: string
  capacity?: number
  optimalCapacity?: number
  equipment?: string[]
  accessibilityFeatures?: string[]
  roomCharacteristics?: {
    lighting?: string
    acoustics?: string
    airConditioning?: boolean
    naturalLight?: boolean
  }
}

interface Room {
  id: number
  name: string
  type: RoomType
  minCapacity?: number
  maxCapacity?: number
  createdAt: string
  timetable: TimetableEntry[]
  enhancement?: RoomEnhancement
}

interface RoomDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
  onEdit: (room: Room) => void
}

export function RoomDetailsModal({
  open,
  onOpenChange,
  room,
  onEdit,
}: RoomDetailsModalProps) {
  if (!room) return null

  const isScheduled = room.timetable.length > 0
  const uniqueCourses = new Set(room.timetable.map(entry => entry.course.id)).size
  const uniqueDays = new Set(room.timetable.map(entry => entry.day)).size
  const createdDate = new Date(room.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return "1st"
    if (number === 2) return "2nd"
    if (number === 3) return "3rd"
    return `${number}th`
  }

  const roomGradients = [
    "from-cyan-500 to-blue-500",
    "from-purple-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500",
  ]

  const gradient = roomGradients[room.id % roomGradients.length]
  const Icon = room.type === RoomType.LAB ? FlaskConical : School

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{room.name}</DialogTitle>
              <DialogDescription>
                Room details and scheduling information
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-6"
          >
            {/* Room Header Card */}
            <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${gradient}`}>
              <div className="absolute inset-0 opacity-10" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <Icon className="h-12 w-12" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{room.name}</h3>
                        <div className="flex items-center gap-2 text-white/90 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="capitalize">{room.type.toLowerCase()}</span>
                          {room.enhancement?.building && (
                            <>
                              <span>•</span>
                              <span>{room.enhancement.building}</span>
                            </>
                          )}
                          {room.enhancement?.floor && (
                            <>
                              <span>•</span>
                              <span>{room.enhancement.floor}</span>
                            </>
                          )}
                        </div>
                        {room.maxCapacity && (
                          <div className="flex items-center gap-2 text-white/90">
                            <Users className="h-4 w-4" />
                            <span>Capacity: {room.maxCapacity} students</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={room.type === RoomType.LAB ? "bg-purple-500 text-white" : "bg-blue-500 text-white"}>
                          {room.type === RoomType.LAB ? "Laboratory" : "Classroom"}
                        </Badge>
                        {isScheduled ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            In Use
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-2">
                  <Info className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule ({room.timetable.length})
                </TabsTrigger>
                <TabsTrigger value="facilities" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Facilities
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Room:</span>
                          <span className="text-sm font-medium">{room.name}</span>
                        </div>
                        {room.enhancement?.building && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Building:</span>
                            <span className="text-sm font-medium">{room.enhancement.building}</span>
                          </div>
                        )}
                        {room.enhancement?.floor && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Floor:</span>
                            <span className="text-sm font-medium">{room.enhancement.floor}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Created:</span>
                          <span className="text-sm font-medium">{createdDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Capacity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {room.minCapacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Minimum:</span>
                            <span className="text-sm font-medium">{room.minCapacity} students</span>
                          </div>
                        )}
                        {room.enhancement?.optimalCapacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Optimal:</span>
                            <span className="text-sm font-medium text-emerald-600">{room.enhancement.optimalCapacity} students</span>
                          </div>
                        )}
                        {room.maxCapacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Maximum:</span>
                            <span className="text-sm font-medium">{room.maxCapacity} students</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{room.timetable.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">scheduled sessions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <School className="h-4 w-4 text-emerald-500" />
                        Courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{uniqueCourses}</p>
                      <p className="text-xs text-muted-foreground mt-1">unique courses</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Days Active
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{uniqueDays}</p>
                      <p className="text-xs text-muted-foreground mt-1">days per week</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-6">
                {room.timetable.length > 0 ? (
                  <div className="space-y-3">
                    {room.timetable.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{entry.course.name}</h4>
                              {entry.course.code && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.course.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <School className="h-4 w-4" />
                                <span>{entry.course.semester.program.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{getSemesterOrdinal(entry.course.semester.number)} Semester</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{entry.day}</p>
                            <p className="text-muted-foreground">
                              {entry.timeslot.start} - {entry.timeslot.end}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Sessions Scheduled</h3>
                      <p className="text-muted-foreground">
                        This room is currently available for scheduling.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="facilities" className="space-y-4 mt-6">
                {room.enhancement?.equipment && room.enhancement.equipment.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Available Equipment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {room.enhancement.equipment.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {room.enhancement?.accessibilityFeatures && room.enhancement.accessibilityFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Accessibility className="h-4 w-4" />
                        Accessibility Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {room.enhancement.accessibilityFeatures.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {room.enhancement?.roomCharacteristics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Room Characteristics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {room.enhancement.roomCharacteristics.lighting && (
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">Lighting: {room.enhancement.roomCharacteristics.lighting}</span>
                          </div>
                        )}
                        {room.enhancement.roomCharacteristics.acoustics && (
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Acoustics: {room.enhancement.roomCharacteristics.acoustics}</span>
                          </div>
                        )}
                        {room.enhancement.roomCharacteristics.airConditioning && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Air Conditioning Available</span>
                          </div>
                        )}
                        {room.enhancement.roomCharacteristics.naturalLight && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Natural Light Available</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!room.enhancement?.equipment || room.enhancement.equipment.length === 0) &&
                 (!room.enhancement?.accessibilityFeatures || room.enhancement.accessibilityFeatures.length === 0) &&
                 !room.enhancement?.roomCharacteristics && (
                  <Card className="p-8">
                    <div className="text-center">
                      <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Facilities Information</h3>
                      <p className="text-muted-foreground mb-4">
                        Additional facility information has not been added yet.
                      </p>
                      <Button onClick={() => onEdit(room)} variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Add Facilities
                      </Button>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Utilization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Sessions:</span>
                          <span className="font-semibold">{room.timetable.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Unique Courses:</span>
                          <span className="font-semibold">{uniqueCourses}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Active Days:</span>
                          <span className="font-semibold">{uniqueDays}/7 days</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Utilization Rate:</span>
                            <span className="font-semibold">
                              {uniqueDays > 0 ? Math.round((uniqueDays / 7) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Capacity Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {room.minCapacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Min Capacity:</span>
                            <span className="font-semibold">{room.minCapacity}</span>
                          </div>
                        )}
                        {room.enhancement?.optimalCapacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Optimal Capacity:</span>
                            <span className="font-semibold text-emerald-600">{room.enhancement.optimalCapacity}</span>
                          </div>
                        )}
                        {room.maxCapacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Max Capacity:</span>
                            <span className="font-semibold">{room.maxCapacity}</span>
                          </div>
                        )}
                        {room.enhancement?.equipment && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Equipment Items:</span>
                              <span className="font-semibold">{room.enhancement.equipment.length}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </ScrollArea>

        <DialogFooter className="shrink-0 p-6 pt-0 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              onEdit(room)
              onOpenChange(false)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}