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
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Award,
  BookOpen,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  Briefcase,
  Edit,
  X,
  CheckCircle2,
  XCircle,
  Globe,
  FileText,
  TrendingUp,
  Target
} from "lucide-react"
import { motion } from "framer-motion"

interface Department {
  id: number
  name: string
  code?: string
}

interface Program {
  id: number
  name: string
}

interface Semester {
  id: number
  number: number
  program: Program
}

interface Course {
  id: number
  name: string
  code: string
  semester: Semester
  enrollments?: Array<{ id: number }>
  timetable?: Array<{ id: number }>
}

interface Faculty {
  id: number
  name: string
  email: string
  phone?: string
  designation?: string
  employmentType?: string
  department?: Department
  createdAt: string
  courses: Course[]
  timetable: Array<{ id: number }>
  // Extended fields (may not be available in current API)
  officeLocation?: string
  specialization?: string
  qualifications?: string
  experience?: number
  researchInterests?: string
}

interface FacultyDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  faculty: Faculty | null
  onEdit: (faculty: Faculty) => void
}

export function FacultyDetailsModal({
  open,
  onOpenChange,
  faculty,
  onEdit,
}: FacultyDetailsModalProps) {
  if (!faculty) return null

  const isScheduled = faculty.timetable.length > 0
  const courseCount = faculty.courses.length
  const totalEnrollments = faculty.courses.reduce((sum, course) => 
    sum + (course.enrollments?.length || 0), 0
  )
  const createdDate = new Date(faculty.createdAt).toLocaleDateString("en-US", {
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

  const facultyGradients = [
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500",
  ]

  const gradient = facultyGradients[faculty.id % facultyGradients.length]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{faculty.name}</DialogTitle>
              <DialogDescription>
                Faculty member profile and course assignments
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
            {/* Faculty Header Card */}
            <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${gradient}`}>
              <div className="absolute inset-0 opacity-10" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold">
                    {faculty.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{faculty.name}</h3>
                        {faculty.designation && (
                          <Badge className="bg-white/20 text-white border-white/30 mb-2">
                            {faculty.designation}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-white/90">
                          <Mail className="h-4 w-4" />
                          <span>{faculty.email}</span>
                        </div>
                        {faculty.phone && (
                          <div className="flex items-center gap-2 text-white/90 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{faculty.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {courseCount > 0 ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {courseCount} Courses
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            No Courses
                          </Badge>
                        )}
                        {isScheduled ? (
                          <Badge className="bg-blue-500 text-white">
                            <Calendar className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Scheduled
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
                  <User className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="courses" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses ({courseCount})
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Profile
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
                        <Briefcase className="h-4 w-4" />
                        Employment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Type:</span>
                          <Badge variant={faculty.employmentType === "PERMANENT" ? "default" : "secondary"}>
                            {faculty.employmentType || "Not specified"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Joined:</span>
                          <span className="text-sm font-medium">{createdDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Department
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {faculty.department ? (
                        <div className="space-y-2">
                          <p className="font-medium">{faculty.department.name}</p>
                          {faculty.department.code && (
                            <Badge variant="outline" className="text-xs">
                              {faculty.department.code}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span className="text-sm">No department assigned</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {faculty.officeLocation && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Office Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{faculty.officeLocation}</p>
                      </CardContent>
                    </Card>
                  )}

                  {faculty.specialization && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Specialization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{faculty.specialization}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        Courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{courseCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">assigned courses</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-500" />
                        Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{totalEnrollments}</p>
                      <p className="text-xs text-muted-foreground mt-1">total enrollments</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{faculty.timetable.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">scheduled slots</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4 mt-6">
                {courseCount > 0 ? (
                  <div className="space-y-3">
                    {faculty.courses.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{course.name}</h4>
                              {course.code && (
                                <Badge variant="outline" className="text-xs">
                                  {course.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-4 w-4" />
                                <span>{course.semester.program.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{getSemesterOrdinal(course.semester.number)} Semester</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-semibold">{course.enrollments?.length || 0}</p>
                              <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">{course.timetable?.length || 0}</p>
                              <p className="text-xs text-muted-foreground">Slots</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
                      <p className="text-muted-foreground">
                        This faculty member has not been assigned to any courses yet.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4 mt-6">
                {faculty.qualifications && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Qualifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{faculty.qualifications}</p>
                    </CardContent>
                  </Card>
                )}

                {faculty.researchInterests && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Research Interests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{faculty.researchInterests}</p>
                    </CardContent>
                  </Card>
                )}

                {faculty.experience && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{faculty.experience}</span>
                        <span className="text-muted-foreground">years of experience</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!faculty.qualifications && !faculty.researchInterests && !faculty.experience && (
                  <Card className="p-8">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Profile Incomplete</h3>
                      <p className="text-muted-foreground mb-4">
                        Additional profile information has not been added yet.
                      </p>
                      <Button onClick={() => onEdit(faculty)} variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Complete Profile
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
                        Workload Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {faculty.courses.length > 0 ? (
                          faculty.courses.map((course) => (
                            <div key={course.id} className="flex items-center justify-between">
                              <span className="text-sm truncate">{course.code || course.name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(100, ((course.enrollments?.length || 0) / 50) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8">
                                  {course.enrollments?.length || 0}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No courses assigned</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Schedule Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Slots:</span>
                          <span className="font-semibold">{faculty.timetable.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Courses:</span>
                          <span className="font-semibold">{courseCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Students:</span>
                          <span className="font-semibold">{totalEnrollments}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Avg. Students/Course:</span>
                            <span className="font-semibold">
                              {courseCount > 0 ? Math.round(totalEnrollments / courseCount) : 0}
                            </span>
                          </div>
                        </div>
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
              onEdit(faculty)
              onOpenChange(false)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Faculty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}