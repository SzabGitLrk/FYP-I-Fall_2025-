"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnrollmentForm } from "@/components/forms/enrollment-form"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { StudentEnrollmentTable } from "@/components/enrollment/student-enrollment-table"
import { Plus, UserCheck, BookOpen, GraduationCap, Users, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface StudentWithEnrollments {
  id: number
  regId: string
  regName: string
  email: string
  program: {
    id: number
    name: string
    code: string
    department: {
      id: number
      name: string
      code: string
    }
  }
  enrollments: Array<{
    id: number
    courseId: number
    course: {
      id: number
      name: string
      code: string
      type: string
      semester: {
        id: number
        number: number
      }
    }
    enrolledAt: string
    isActive: boolean
  }>
}

export default function EnrollmentsPage() {
  const [students, setStudents] = useState<StudentWithEnrollments[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<number | null>(null)
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<number | null>(null)
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/enrollments/by-student')
      const result = await response.json()
      
      if (result.success) {
        setStudents(result.data)
      } else {
        toast.error('Failed to fetch student enrollments')
      }
    } catch (error) {
      toast.error('Failed to fetch student enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExpand = (studentId: number) => {
    setExpandedStudentIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const handleEnrollClick = (studentId: number) => {
    setSelectedStudentForEnroll(studentId)
    setShowEnrollDialog(true)
  }

  const handleRemoveEnrollment = (enrollmentId: number) => {
    setDeletingEnrollmentId(enrollmentId)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEnrollmentId) return
    
    try {
      const response = await fetch(`/api/enrollments/${deletingEnrollmentId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Enrollment removed successfully')
        
        // Update local state to remove the enrollment
        setStudents((prevStudents) =>
          prevStudents.map((student) => ({
            ...student,
            enrollments: student.enrollments.filter(
              (enrollment) => enrollment.id !== deletingEnrollmentId
            ),
          }))
        )
      } else {
        toast.error(result.error || 'Failed to remove enrollment')
      }
    } catch (error) {
      toast.error('Failed to remove enrollment')
    } finally {
      setDeletingEnrollmentId(null)
    }
  }

  const handleEnrollSuccess = () => {
    fetchStudents()
    setShowEnrollDialog(false)
    setSelectedStudentForEnroll(null)
  }

  const handleEnrollDialogClose = (open: boolean) => {
    setShowEnrollDialog(open)
    if (!open) {
      setSelectedStudentForEnroll(null)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Calculate statistics based on filtered students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students
    }

    const query = searchQuery.toLowerCase().trim()
    return students.filter(
      (student) =>
        student.regId.toLowerCase().includes(query) ||
        student.regName.toLowerCase().includes(query)
    )
  }, [students, searchQuery])

  const statistics = useMemo(() => {
    const totalStudents = filteredStudents.length
    const totalEnrollments = filteredStudents.reduce(
      (sum, student) => sum + student.enrollments.length,
      0
    )
    const studentsWithActiveEnrollments = filteredStudents.filter((student) =>
      student.enrollments.some((enrollment) => enrollment.isActive)
    ).length

    return {
      totalStudents,
      totalEnrollments,
      studentsWithActiveEnrollments,
    }
  }, [filteredStudents])

  // Find the enrollment being deleted for the confirmation dialog
  const deletingEnrollment = useMemo(() => {
    if (!deletingEnrollmentId) return null
    
    for (const student of students) {
      const enrollment = student.enrollments.find((e) => e.id === deletingEnrollmentId)
      if (enrollment) {
        return {
          studentName: student.regName,
          courseName: enrollment.course.code || enrollment.course.name,
        }
      }
    }
    return null
  }, [deletingEnrollmentId, students])

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <UserCheck className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Student Enrollments</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage student course enrollments and track academic progress
              </p>
            </div>
            <Button 
              onClick={() => setShowEnrollDialog(true)}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Enroll Student
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                  <p className="text-4xl font-bold">{statistics.totalStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Users className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Enrollments</p>
                  <p className="text-4xl font-bold">{statistics.totalEnrollments}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Students</p>
                  <p className="text-4xl font-bold">{statistics.studentsWithActiveEnrollments}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-2 hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Student Enrollment Management
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  View and manage student enrollments. Click on a student to expand and see their enrolled courses.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Users className="h-3 w-3 mr-1" />
                  {statistics.totalStudents} Students
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {statistics.totalEnrollments} Enrollments
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <StudentEnrollmentTable
              students={students}
              expandedStudentIds={expandedStudentIds}
              onToggleExpand={handleToggleExpand}
              onEnrollClick={handleEnrollClick}
              onRemoveEnrollment={handleRemoveEnrollment}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      </motion.div>

      <EnrollmentForm
        open={showEnrollDialog}
        onOpenChange={handleEnrollDialogClose}
        onSuccess={handleEnrollSuccess}
        preSelectedStudentId={selectedStudentForEnroll ?? undefined}
      />

      <DeleteDialog
        open={!!deletingEnrollmentId}
        onOpenChange={(open) => !open && setDeletingEnrollmentId(null)}
        title="Remove Enrollment"
        description={
          deletingEnrollment
            ? `Are you sure you want to remove ${deletingEnrollment.studentName} from ${deletingEnrollment.courseName}? This action cannot be undone.`
            : "Are you sure you want to remove this enrollment?"
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
