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
  BookOpen,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  Edit,
  X,
  CheckCircle2,
  XCircle,
  Hash,
  TrendingUp,
  Target,
  Award
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
  code?: string
  department: Department
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
}

interface Enrollment {
  id: number
  course: Course
  enrolledAt: string
}

interface Student {
  id: number
  regId: string
  regName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  isActive: boolean
  createdAt: string
  program?: Program
  semester?: Semester
  enrollments: Enrollment[]
}

interface StudentDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onEdit: (student: Student) => void
}

export function StudentDetailsModal({
  open,
  onOpenChange,
  student,
  onEdit,
}: StudentDetailsModalProps) {
  if (!student) return null

  const enrollmentCount = student.enrollments.length
  const createdDate = new Date(student.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const dateOfBirth = student.dateOfBirth 
    ? new Date(student.dateOfBirth).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return "1st"
    if (number === 2) return "2nd"
    if (number === 3) return "3rd"
    return `${number}th`
  }

  const studentGradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500",
  ]

  const gradient = studentGradients[student.id % studentGradients.length]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{student.regName}</DialogTitle>
              <DialogDescription>
                Student profile and enrollment details
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
            {/* Student Header Card */}
            <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${gradient}`}>
              <div className="absolute inset-0 opacity-10" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold">
                    {student.regName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{student.regName}</h3>
                        <div className="flex items-center gap-2 text-white/90 mb-2">
                          <Hash className="h-4 w-4" />
                          <span className="font-mono">{student.regId}</span>
                        </div>
                        {student.email && (
                          <div className="flex items-center gap-2 text-white/90">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                        )}
                        {student.phone && (
                          <div className="flex items-center gap-2 text-white/90 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {student.isActive ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {enrollmentCount > 0 ? (
                          <Badge className="bg-blue-500 text-white">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {enrollmentCount} Courses
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                            <BookOpen className="h-3 w-3 mr-1" />
                            No Enrollments
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
                <TabsTrigger value="academic" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic
                </TabsTrigger>
                <TabsTrigger value="enrollments" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Enrollments ({enrollmentCount})
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
                        <Hash className="h-4 w-4" />
                        Registration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ID:</span>
                          <span className="text-sm font-mono font-medium">{student.regId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Registered:</span>
                          <span className="text-sm font-medium">{createdDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant={student.isActive ? "default" : "secondary"}>
                            {student.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Program
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {student.program ? (
                        <div className="space-y-2">
                          <p className="font-medium">{student.program.name}</p>
                          <p className="text-sm text-muted-foreground">{student.program.department.name}</p>
                          {student.program.code && (
                            <Badge variant="outline" className="text-xs">
                              {student.program.code}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span className="text-sm">No program assigned</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {student.semester && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Current Semester
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-medium">{getSemesterOrdinal(student.semester.number)} Semester</p>
                          <p className="text-sm text-muted-foreground">{student.semester.program.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {dateOfBirth && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{dateOfBirth}</p>
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
                        Enrollments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{enrollmentCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">enrolled courses</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-emerald-500" />
                        Program
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{student.program ? "1" : "0"}</p>
                      <p className="text-xs text-muted-foreground mt-1">assigned program</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        Semester
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{student.semester?.number || "N/A"}</p>
                      <p className="text-xs text-muted-foreground mt-1">current semester</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4 mt-6">
                {student.program ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Academic Program
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Program Name:</span>
                          <p className="font-medium">{student.program.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Department:</span>
                          <p className="font-medium">{student.program.department.name}</p>
                        </div>
                        {student.program.code && (
                          <div>
                            <span className="text-sm text-muted-foreground">Program Code:</span>
                            <p className="font-medium font-mono">{student.program.code}</p>
                          </div>
                        )}
                        {student.semester && (
                          <div>
                            <span className="text-sm text-muted-foreground">Current Semester:</span>
                            <p className="font-medium">{getSemesterOrdinal(student.semester.number)} Semester</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Academic Program</h3>
                      <p className="text-muted-foreground mb-4">
                        This student has not been assigned to any academic program yet.
                      </p>
                      <Button onClick={() => onEdit(student)} variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Assign Program
                      </Button>
                    </div>
                  </Card>
                )}

                {student.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{student.address}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="enrollments" className="space-y-4 mt-6">
                {enrollmentCount > 0 ? (
                  <div className="space-y-3">
                    {student.enrollments.map((enrollment) => (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{enrollment.course.name}</h4>
                              {enrollment.course.code && (
                                <Badge variant="outline" className="text-xs">
                                  {enrollment.course.code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-4 w-4" />
                                <span>{enrollment.course.semester.program.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{getSemesterOrdinal(enrollment.course.semester.number)} Semester</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">Enrolled</p>
                            <p className="font-medium">
                              {new Date(enrollment.enrolledAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Course Enrollments</h3>
                      <p className="text-muted-foreground">
                        This student has not been enrolled in any courses yet.
                      </p>
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
                        Enrollment Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Enrollments:</span>
                          <span className="font-semibold">{enrollmentCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Program Assigned:</span>
                          <Badge variant={student.program ? "default" : "secondary"}>
                            {student.program ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Semester Assigned:</span>
                          <Badge variant={student.semester ? "default" : "secondary"}>
                            {student.semester ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Profile Completion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: "Basic Info", completed: !!(student.regId && student.regName) },
                          { label: "Contact Info", completed: !!(student.email || student.phone) },
                          { label: "Program", completed: !!student.program },
                          { label: "Personal Info", completed: !!(student.dateOfBirth || student.address) },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.label}:</span>
                            <Badge variant={item.completed ? "default" : "secondary"}>
                              {item.completed ? "Complete" : "Incomplete"}
                            </Badge>
                          </div>
                        ))}
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
              onEdit(student)
              onOpenChange(false)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}