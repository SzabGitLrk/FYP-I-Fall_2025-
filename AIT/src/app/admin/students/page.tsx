"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-states"
import { EnhancedStudentForm } from "@/components/forms/enhanced-student-form"
import { BulkStudentForm } from "@/components/forms/bulk-student-form"
import { StudentDetailsModal } from "@/components/modals/student-details-modal"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { 
  Plus, 
  Users, 
  UserCheck, 
  UserX, 
  GraduationCap, 
  Mail, 
  Phone,
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  Sparkles,
  ChevronDown,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

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
  program?: {
    id: number
    name: string
    code?: string
    department: {
      id: number
      name: string
    }
  }
  semester?: {
    id: number
    number: number
  }
  enrollments: {
    id: number
    course: {
      id: number
      name: string
      code?: string
    }
    enrolledAt: string
  }[]
}

interface Program {
  id: number
  name: string
  code?: string
  department: {
    name: string
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | undefined>()
  const [viewingStudent, setViewingStudent] = useState<Student | undefined>()
  const [deleteStudent, setDeleteStudent] = useState<Student | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'enrolled'>('all')

  const fetchStudents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/students')
      const result = await response.json()
      
      if (result.success) {
        setStudents(result.data)
      } else {
        toast.error('Failed to fetch students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (result.success) {
        setPrograms(result.data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  useEffect(() => {
    fetchStudents()
    fetchPrograms()
  }, [])

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
  }

  const handleView = (student: Student) => {
    setViewingStudent(student)
  }

  const handleDeleteClick = (student: Student) => {
    setDeleteStudent(student)
  }

  const handleDelete = async () => {
    if (!deleteStudent) return

    try {
      const response = await fetch(`/api/students/${deleteStudent.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Student deleted successfully')
        fetchStudents()
      } else {
        toast.error(result.error || 'Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('Failed to delete student')
    } finally {
      setDeleteStudent(undefined)
    }
  }

  const handleFormSuccess = () => {
    fetchStudents()
  }

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.regId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.regName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.program && student.program.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && student.isActive) ||
      (activeTab === 'inactive' && !student.isActive) ||
      (activeTab === 'enrolled' && student.enrollments.length > 0)

    return matchesSearch && matchesTab
  })

  // Calculate statistics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.isActive).length
  const inactiveStudents = totalStudents - activeStudents
  const enrolledStudents = students.filter(s => s.enrollments.length > 0).length

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const studentGradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-violet-500',
    'from-rose-500 to-pink-500',
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading students..." />
      </div>
    )
  }

  if (students.length === 0 && !showEnhancedForm) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Students</h1>
            </div>
            <p className="text-white/90 text-lg">Manage student registrations and enrollments</p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No students found"
          description="Get started by adding your first student"
          action={{
            label: "Add Student",
            onClick: () => setShowEnhancedForm(true)
          }}
        />
        <EnhancedStudentForm
          open={showEnhancedForm}
          onOpenChange={setShowEnhancedForm}
          onSuccess={handleFormSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Students</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage student registrations, academic programs, and enrollments
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90 shadow-lg gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Student
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Add Student</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEnhancedForm(true)} className="gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Enhanced Form
                  <Badge variant="secondary" className="ml-auto text-xs">Full</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBulkForm(true)} className="gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Bulk Import
                  <Badge variant="secondary" className="ml-auto text-xs">CSV</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                  <p className="text-4xl font-bold">{totalStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Students</p>
                  <p className="text-4xl font-bold">{activeStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-orange-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Enrolled Students</p>
                  <p className="text-4xl font-bold">{enrolledStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Inactive Students</p>
                  <p className="text-4xl font-bold">{inactiveStudents}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500">
                  <UserX className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, registration ID, email, or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-4">
                <TabsTrigger value="all" className="gap-2">
                  <Users className="h-4 w-4" />
                  All ({totalStudents})
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2">
                  <UserCheck className="h-4 w-4" />
                  Active ({activeStudents})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="gap-2">
                  <UserX className="h-4 w-4" />
                  Inactive ({inactiveStudents})
                </TabsTrigger>
                <TabsTrigger value="enrolled" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Enrolled ({enrolledStudents})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first student'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowEnhancedForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student, index) => {
            const gradient = studentGradients[index % studentGradients.length]
            const enrollmentCount = student.enrollments.length
            
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-300 h-full group">
                  {/* Gradient Top Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradient}`} />
                  
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg flex items-center justify-center text-white text-2xl font-bold`}>
                        {student.regName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {student.isActive ? (
                          <Badge variant="default" className="bg-emerald-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {enrollmentCount > 0 ? (
                          <Badge variant="default" className="bg-blue-500">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {enrollmentCount} Courses
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            No Enrollments
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{student.regName}</CardTitle>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span className="font-mono">{student.regId}</span>
                      </div>
                      {student.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Academic Information */}
                    <div className="pt-3 border-t">
                      {student.program ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Academic Program</span>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium text-sm">{student.program.name}</p>
                            <p className="text-xs text-muted-foreground">{student.program.department.name}</p>
                            {student.semester && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {getSemesterOrdinal(student.semester.number)} Semester
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground italic">
                          No academic program assigned
                        </div>
                      )}
                    </div>

                    {/* Enrollment Summary */}
                    {enrollmentCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium">Recent Enrollments</span>
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {student.enrollments.slice(0, 2).map((enrollment) => (
                            <div key={enrollment.id} className="text-xs p-2 bg-muted/30 rounded">
                              <p className="font-medium">{enrollment.course.code || enrollment.course.name}</p>
                            </div>
                          ))}
                          {enrollmentCount > 2 && (
                            <p className="text-xs text-center text-muted-foreground py-1">
                              +{enrollmentCount - 2} more courses
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(student)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(student)} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(student)}
                            disabled={enrollmentCount > 0}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-lg`} />
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <EnhancedStudentForm
        open={showEnhancedForm}
        onOpenChange={setShowEnhancedForm}
        onSuccess={handleFormSuccess}
      />

      <BulkStudentForm
        open={showBulkForm}
        onOpenChange={setShowBulkForm}
        onSuccess={handleFormSuccess}
      />

      <EnhancedStudentForm
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(undefined)}
        student={editingStudent}
        onSuccess={handleFormSuccess}
      />

      <StudentDetailsModal
        open={!!viewingStudent}
        onOpenChange={(open) => !open && setViewingStudent(undefined)}
        student={viewingStudent}
        onEdit={(student) => {
          setViewingStudent(undefined)
          handleEdit(student)
        }}
      />

      <DeleteDialog
        open={!!deleteStudent}
        onOpenChange={(open) => !open && setDeleteStudent(undefined)}
        title="Delete Student"
        description={`Are you sure you want to delete "${deleteStudent?.regName}" (${deleteStudent?.regId})? ${
          deleteStudent?.enrollments.length ? 
          'This student has active enrollments and cannot be deleted. Please remove enrollments first.' :
          'This action cannot be undone and will remove all student data.'
        }`}
        onConfirm={handleDelete}
      />
    </div>
  )
}