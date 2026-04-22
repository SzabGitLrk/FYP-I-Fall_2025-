"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { EnhancedCourseForm } from "@/components/forms/enhanced-course-form"
import { BulkCourseForm } from "@/components/forms/bulk-course-form"
import { QuickCourseForm } from "@/components/forms/quick-course-form"
import { EnrollmentForm } from "@/components/forms/enrollment-form"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { CourseDetailsModal } from "@/components/modals/course-details-modal"
import { 
  Plus, 
  BookOpen, 
  User, 
  GraduationCap, 
  Users, 
  Edit,
  Trash2,
  Search,
  FlaskConical,
  BookMarked,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  UserCheck,
  Clock,
  Zap,
  Copy,
  Upload,
  Sparkles,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import { CourseType } from "@/lib/types"
import { motion } from "framer-motion"

interface Program {
  id: number
  name: string
  code?: string
}

interface Semester {
  id: number
  number: number
  program: Program
}

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
  semester: Semester
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [duplicatingCourse, setDuplicatingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [enrollmentCourseId, setEnrollmentCourseId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'theory' | 'lab'>('all')
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const result = await response.json()
      
      if (result.success) {
        setCourses(result.data)
      } else {
        toast.error('Failed to fetch courses')
      }
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCourse) return
    
    try {
      const response = await fetch(`/api/courses/${deletingCourse.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Course deleted successfully')
        fetchCourses()
      } else {
        toast.error(result.error || 'Failed to delete course')
      }
    } catch (error) {
      toast.error('Failed to delete course')
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
  }

  const handleDeleteClick = (course: Course) => {
    setDeletingCourse(course)
  }

  const handleDuplicate = (course: Course) => {
    setDuplicatingCourse(course)
    setShowEnhancedForm(true)
  }

  const handleViewDetails = (course: Course) => {
    setViewingCourse(course)
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.semester.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.faculty?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'theory' && course.type === CourseType.THEORY) ||
                      (activeTab === 'lab' && course.type === CourseType.LAB)
    
    return matchesSearch && matchesTab
  })

  // Statistics
  const theoryCourses = courses.filter(c => c.type === CourseType.THEORY)
  const labCourses = courses.filter(c => c.type === CourseType.LAB)
  const scheduledCourses = courses.filter(c => c.timetable.length > 0)
  const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollments?.length || 0), 0)
  const coursesWithFaculty = courses.filter(c => c.faculty).length

  const courseGradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-violet-500',
    'from-rose-500 to-pink-500',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading courses..." />
      </div>
    )
  }

  if (courses.length === 0 && !showCreateForm) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Courses</h1>
            </div>
            <p className="text-white/90 text-lg">Manage courses and assign faculty</p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No courses found"
          description="Get started by creating your first course"
          action={{
            label: "Add Course",
            onClick: () => setShowQuickForm(true)
          }}
        />
        <QuickCourseForm
          open={showQuickForm}
          onOpenChange={setShowQuickForm}
          onSuccess={fetchCourses}
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Courses</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage theory and lab courses, assign faculty, and track enrollments
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-white/90 shadow-lg gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Course
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Create Course</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowQuickForm(true)} className="gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Quick Create
                  <Badge variant="secondary" className="ml-auto text-xs">Fast</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEnhancedForm(true)} className="gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Enhanced Form
                  <Badge variant="secondary" className="ml-auto text-xs">Full</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBulkForm(true)} className="gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Bulk Create
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Courses</p>
                  <p className="text-4xl font-bold">{courses.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Theory</p>
                  <p className="text-4xl font-bold">{theoryCourses.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <BookMarked className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Lab</p>
                  <p className="text-4xl font-bold">{labCourses.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <FlaskConical className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-orange-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled</p>
                  <p className="text-4xl font-bold">{scheduledCourses.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                  <Calendar className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Enrollments</p>
                  <p className="text-4xl font-bold">{totalEnrollments}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500">
                  <Users className="h-8 w-8 text-white" />
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
                placeholder="Search by course name, code, program, or faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  All ({courses.length})
                </TabsTrigger>
                <TabsTrigger value="theory" className="gap-2">
                  <BookMarked className="h-4 w-4" />
                  Theory ({theoryCourses.length})
                </TabsTrigger>
                <TabsTrigger value="lab" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Lab ({labCourses.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first course'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowQuickForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const gradient = courseGradients[index % courseGradients.length]
            const isScheduled = course.timetable.length > 0
            const enrollmentCount = course.enrollments?.length || 0
            
            return (
              <motion.div
                key={course.id}
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
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        {course.type === CourseType.LAB ? (
                          <FlaskConical className="h-6 w-6 text-white" />
                        ) : (
                          <BookMarked className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={course.type === CourseType.LAB ? "secondary" : "default"}>
                          {course.type}
                        </Badge>
                        {isScheduled ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Scheduled
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2 line-clamp-2">{course.name}</CardTitle>
                    {course.code && (
                      <Badge variant="outline" className="w-fit">{course.code}</Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Program & Semester */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">{course.semester.program.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{getSemesterOrdinal(course.semester.number)} Semester</span>
                      </div>
                    </div>

                    {/* Faculty */}
                    <div className="pt-3 border-t">
                      {course.faculty ? (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                            {course.faculty.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{course.faculty.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{course.faculty.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                          <User className="h-4 w-4" />
                          <span>No faculty assigned</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{enrollmentCount}</span>
                        <span className="text-xs text-muted-foreground">Students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium">{course.timetable.length}</span>
                        <span className="text-xs text-muted-foreground">Slots</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(course)}
                        className="flex-1"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(course)} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(course)} className="gap-2">
                            <Copy className="h-4 w-4" />
                            Duplicate Course
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(course)}
                            disabled={course.timetable.length > 0 || enrollmentCount > 0}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Course
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

      <QuickCourseForm
        open={showQuickForm}
        onOpenChange={setShowQuickForm}
        onSuccess={fetchCourses}
      />

      <EnhancedCourseForm
        open={showEnhancedForm}
        onOpenChange={(open) => {
          setShowEnhancedForm(open)
          if (!open) {
            setDuplicatingCourse(null)
          }
        }}
        onSuccess={fetchCourses}
        duplicateFrom={duplicatingCourse || undefined}
      />

      <BulkCourseForm
        open={showBulkForm}
        onOpenChange={setShowBulkForm}
        onSuccess={fetchCourses}
      />

      <EnhancedCourseForm
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        course={editingCourse || undefined}
        onSuccess={fetchCourses}
      />

      <EnrollmentForm
        open={showEnrollmentForm}
        onOpenChange={(open) => {
          setShowEnrollmentForm(open)
          if (!open) {
            setEnrollmentCourseId(undefined)
          }
        }}
        onSuccess={fetchCourses}
      />

      <DeleteDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        title="Delete Course"
        description={`Are you sure you want to delete "${deletingCourse?.name}"${deletingCourse?.code ? ` (${deletingCourse.code})` : ''}? This will also remove any timetable entries for this course. This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      <CourseDetailsModal
        open={!!viewingCourse}
        onOpenChange={(open) => !open && setViewingCourse(null)}
        course={viewingCourse}
        onEdit={(course) => {
          setViewingCourse(null)
          handleEdit(course)
        }}
      />
    </div>
  )
}
