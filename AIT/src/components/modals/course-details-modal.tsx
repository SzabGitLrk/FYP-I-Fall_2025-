"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  BookMarked,
  FlaskConical,
  GraduationCap,
  Layers,
  User,
  Users,
  Calendar,
  Mail,
  Edit,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Code,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  UserMinus,
  HelpCircle,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CourseType } from "@/lib/types"
import { motion } from "framer-motion"

interface Faculty {
  id: number
  name: string
  email: string
}

interface Course {
  id: number
  name: string
  code: string | null
  type: CourseType
  createdAt: string
  semester: {
    id: number
    number: number
    program: {
      id: number
      name: string
    }
  }
  faculty?: Faculty
  timetable: Array<{ id: number }>
  enrollments: Array<{
    id: number
    student: {
      id: number
      regId: string
      regName: string
    }
  }>
}

interface CourseDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onEdit: (course: Course) => void
  onViewStudent?: (studentId: number) => void
  onRemoveEnrollment?: (enrollmentId: number) => void
}

export function CourseDetailsModal({
  open,
  onOpenChange,
  course,
  onEdit,
  onViewStudent,
  onRemoveEnrollment,
}: CourseDetailsModalProps) {
  // Always call hooks in the same order
  const [studentsExpanded, setStudentsExpanded] = useState(false)
  const [studentSearchQuery, setStudentSearchQuery] = useState("")

  // Reset state when course changes or modal closes
  useEffect(() => {
    if (!open || !course) {
      setStudentsExpanded(false)
      setStudentSearchQuery("")
    }
  }, [open, course?.id]) // Reset when modal closes or course changes

  // Always call useMemo, with safe fallbacks
  const filteredStudents = useMemo(() => {
    const enrollments = course?.enrollments || []
    if (!studentSearchQuery.trim()) {
      return enrollments
    }
    
    const query = studentSearchQuery.toLowerCase().trim()
    return enrollments.filter(enrollment =>
      enrollment.student.regName.toLowerCase().includes(query) ||
      enrollment.student.regId.toLowerCase().includes(query)
    )
  }, [course?.enrollments, studentSearchQuery])

  // Always define the export function
  const handleExportStudents = () => {
    if (!course?.enrollments?.length) return
    
    const csvData = course.enrollments.map(enrollment => ({
      'Reg ID': enrollment.student.regId,
      'Name': enrollment.student.regName,
      'Course': course.name,
      'Course Code': course.code || 'N/A',
      'Enrolled Date': new Date(enrollment.id).toLocaleDateString(),
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${course.name.replace(/[^a-zA-Z0-9]/g, '_')}_enrolled_students.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
  
  // Early return after all hooks are called
  if (!course) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription>No course selected</DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Please select a course to view details.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return "1st"
    if (number === 2) return "2nd"
    if (number === 3) return "3rd"
    return `${number}th`
  }

  const isScheduled = course.timetable.length > 0
  const enrollmentCount = course.enrollments?.length || 0
  const createdDate = new Date(course.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const courseGradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-violet-500",
    "from-rose-500 to-pink-500",
  ]

  const gradient = courseGradients[course.id % courseGradients.length]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{course.name}</DialogTitle>
              <DialogDescription>
                View and manage course details
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Course Header Card */}
          <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 opacity-10" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {course.type === CourseType.LAB ? (
                      <FlaskConical className="h-8 w-8 text-white" />
                    ) : (
                      <BookMarked className="h-8 w-8 text-white" />
                    )}
                    <div>
                      <Badge className="bg-white/20 text-white border-white/30 mb-2">
                        {course.type}
                      </Badge>
                      {course.code && (
                        <p className="text-white/90 text-sm font-medium">{course.code}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {isScheduled ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Scheduled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Scheduled
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Program & Semester */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{course.semester.program.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getSemesterOrdinal(course.semester.number)} Semester
                </p>
              </CardContent>
            </Card>

            {/* Course Code */}
            {course.code && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Course Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{course.code}</p>
                </CardContent>
              </Card>
            )}

            {/* Created Date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{createdDate}</p>
              </CardContent>
            </Card>

            {/* Course Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {course.type === CourseType.LAB ? (
                    <FlaskConical className="h-4 w-4" />
                  ) : (
                    <BookMarked className="h-4 w-4" />
                  )}
                  Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={course.type === CourseType.LAB ? "secondary" : "default"}>
                  {course.type}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Faculty Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Faculty Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.faculty ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {course.faculty.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{course.faculty.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="h-4 w-4" />
                        {course.faculty.email}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="h-5 w-5" />
                  <span>No faculty assigned to this course</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{enrollmentCount}</p>
                <p className="text-xs text-muted-foreground mt-1">students enrolled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Timetable Slots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{course.timetable.length}</p>
                <p className="text-xs text-muted-foreground mt-1">scheduled slots</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-500" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={isScheduled ? "default" : "outline"}
                  className="text-xs"
                >
                  {isScheduled ? "Active" : "Pending"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {isScheduled ? "Scheduled in timetable" : "Awaiting scheduling"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Enrolled Students Section */}
          {enrollmentCount > 0 && (
            <Card>
              <Collapsible open={studentsExpanded} onOpenChange={setStudentsExpanded}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Enrolled Students ({enrollmentCount})
                      </div>
                      <div className="flex items-center gap-2">
                        {enrollmentCount > 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportStudents()
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        )}
                        {studentsExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Search and Actions */}
                    {enrollmentCount > 5 && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search students..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {filteredStudents.length} of {enrollmentCount}
                        </Badge>
                      </div>
                    )}

                    {/* Students List */}
                    <ScrollArea className={enrollmentCount > 8 ? "h-80" : "h-auto"}>
                      <div className="space-y-2">
                        {filteredStudents.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            {studentSearchQuery ? "No students found matching your search." : "No students enrolled."}
                          </div>
                        ) : (
                          filteredStudents.map((enrollment) => (
                            <motion.div
                              key={enrollment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                  {enrollment.student.regName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{enrollment.student.regName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {enrollment.student.regId}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Enrolled
                                </Badge>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                  {onViewStudent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onViewStudent(enrollment.student.id)}
                                      className="h-8 w-8 p-0"
                                      title="View Student Details"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {onRemoveEnrollment && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`Remove ${enrollment.student.regName} from this course?`)) {
                                          onRemoveEnrollment(enrollment.id)
                                        }
                                      }}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      title="Remove Enrollment"
                                    >
                                      <UserMinus className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {/* Quick Stats */}
                    {enrollmentCount > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Enrolled:</span>
                            <span className="ml-2 font-medium">{enrollmentCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Showing:</span>
                            <span className="ml-2 font-medium">{filteredStudents.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Empty State for No Enrollments */}
          {enrollmentCount === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Enrolled Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No students enrolled yet</p>
                  <p className="text-sm text-muted-foreground">
                    Students will appear here once they enroll in this course.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              onEdit(course)
              onOpenChange(false)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
