"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-states"
import { SemesterForm } from "@/components/forms/semester-form"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { MultiCourseForm } from "@/components/forms/multi-course-form"
import { SemesterCourseDetailsModal } from "@/components/modals/semester-course-details-modal"
import { CourseForm } from "@/components/forms/course-form"
import { 
  Plus, 
  Calendar, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash2,
  Search,
  GraduationCap,
  Layers,
  Clock,
  TrendingUp,
  Sparkles,
  ListOrdered
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Program {
  id: number
  name: string
  code?: string
}

interface Semester {
  id: number
  number: number
  programId: number
  createdAt: string
  program: Program
  courses: Array<{
    id: number
    name: string
    code?: string
    type: string
  }>
}

interface GroupedSemesters {
  [programId: number]: {
    program: Program
    semesters: Semester[]
  }
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [selectedSemesterForCourse, setSelectedSemesterForCourse] = useState<Semester | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set())
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [editingCourse, setEditingCourse] = useState<any>(null)

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters')
      const result = await response.json()
      
      if (result.success) {
        setSemesters(result.data)
        // Auto-expand all programs initially
        const programIds = new Set<number>(result.data.map((s: Semester) => s.programId))
        setExpandedPrograms(programIds)
      } else {
        toast.error('Failed to fetch semesters')
      }
    } catch (error) {
      toast.error('Failed to fetch semesters')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSemester) return
    
    try {
      const response = await fetch(`/api/semesters/${deletingSemester.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Semester deleted successfully')
        fetchSemesters()
      } else {
        toast.error(result.error || 'Failed to delete semester')
      }
    } catch (error) {
      toast.error('Failed to delete semester')
    }
  }

  useEffect(() => {
    fetchSemesters()
  }, [])

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester)
  }

  const handleDeleteClick = (semester: Semester) => {
    setDeletingSemester(semester)
  }

  const handleAddCourse = (semester: Semester) => {
    setSelectedSemesterForCourse(semester)
    setShowCourseForm(true)
  }

  const handleViewCourse = (course: any) => {
    setViewingCourse(course)
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course)
  }

  const toggleProgram = (programId: number) => {
    const newExpanded = new Set(expandedPrograms)
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId)
    } else {
      newExpanded.add(programId)
    }
    setExpandedPrograms(newExpanded)
  }

  // Group semesters by program
  const groupedSemesters: GroupedSemesters = semesters.reduce((acc, semester) => {
    if (!acc[semester.programId]) {
      acc[semester.programId] = {
        program: semester.program,
        semesters: []
      }
    }
    acc[semester.programId].semesters.push(semester)
    return acc
  }, {} as GroupedSemesters)

  // Sort semesters within each program
  Object.values(groupedSemesters).forEach(group => {
    group.semesters.sort((a: Semester, b: Semester) => a.number - b.number)
  })

  // Filter based on search
  const filteredGroups = Object.entries(groupedSemesters).filter(([_, group]) => {
    if (!searchQuery) return true
    return group.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           group.program.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           group.semesters.some((s: Semester) => getSemesterOrdinal(s.number).toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0)
  const avgCoursesPerSemester = semesters.length > 0 ? (totalCourses / semesters.length).toFixed(1) : 0
  const totalPrograms = Object.keys(groupedSemesters).length

  const semesterColors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-violet-500',
    'from-green-500 to-lime-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-yellow-500',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading semesters..." />
      </div>
    )
  }

  if (semesters.length === 0 && !showCreateForm) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Semesters</h1>
            </div>
            <p className="text-white/90 text-lg">Manage semesters within each program</p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No semesters found"
          description="Get started by creating your first semester"
          action={{
            label: "Add Semester",
            onClick: () => setShowCreateForm(true)
          }}
        />
        <SemesterForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={fetchSemesters}
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Semesters</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Organize courses into semesters across all academic programs
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              size="lg"
              className="bg-white text-blue-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Semester
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-cyan-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Semesters</p>
                  <p className="text-4xl font-bold">{semesters.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500">
                  <Layers className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Programs</p>
                  <p className="text-4xl font-bold">{totalPrograms}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Courses</p>
                  <p className="text-4xl font-bold">{totalCourses}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <BookOpen className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg Courses</p>
                  <p className="text-4xl font-bold">{avgCoursesPerSemester}</p>
                  <p className="text-xs text-muted-foreground mt-1">per semester</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by program name, code, or semester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              {filteredGroups.length} programs
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Program Accordion with Semesters */}
      {filteredGroups.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No semesters found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first semester'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Semester
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(([programId, group], programIndex) => {
            const isExpanded = expandedPrograms.has(Number(programId))
            const totalCoursesInProgram = group.semesters.reduce((sum: number, s: Semester) => sum + s.courses.length, 0)
            
            return (
              <motion.div
                key={programId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: programIndex * 0.05 }}
              >
                <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300">
                  {/* Program Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleProgram(Number(programId))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-6 w-6 text-muted-foreground" />
                        </motion.div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold">{group.program.name}</h3>
                            {group.program.code && (
                              <Badge variant="secondary">{group.program.code}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {group.semesters.length} semesters • {totalCoursesInProgram} courses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-base px-4 py-2">
                          <Layers className="h-4 w-4 mr-2" />
                          {group.semesters.length}
                        </Badge>
                        <Badge variant="outline" className="text-base px-4 py-2">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {totalCoursesInProgram}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Semesters List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t bg-muted/20 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {group.semesters.map((semester: Semester, semIndex: number) => {
                              const gradient = semesterColors[semester.number % semesterColors.length]
                              
                              return (
                                <motion.div
                                  key={semester.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: semIndex * 0.05 }}
                                >
                                  <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                    {/* Gradient Top Bar */}
                                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />
                                    
                                    <CardContent className="p-4 pt-5">
                                      {/* Semester Number Badge */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${gradient} text-white font-bold text-sm shadow-md`}>
                                          {getSemesterOrdinal(semester.number)}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                          {semester.courses.length} courses
                                        </Badge>
                                      </div>

                                      {/* Course List */}
                                      {semester.courses.length > 0 ? (
                                        <div className="space-y-2 mb-3">
                                          {semester.courses.slice(0, 3).map((course: { id: number; name: string; code?: string; type: string }) => (
                                            <div 
                                              key={course.id} 
                                              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1.5 rounded transition-colors"
                                              onClick={() => handleViewCourse(course)}
                                            >
                                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`} />
                                              <span className="truncate text-muted-foreground hover:text-foreground font-medium">
                                                {course.code || course.name}
                                              </span>
                                            </div>
                                          ))}
                                          {semester.courses.length > 3 && (
                                            <div className="text-xs text-muted-foreground pl-4">
                                              +{semester.courses.length - 3} more
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-muted-foreground mb-3 italic">
                                          No courses yet
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAddCourse(semester)}
                                          className="flex-1 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Course
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(semester)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteClick(semester)}
                                          disabled={semester.courses.length > 0}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </CardContent>

                                    {/* Hover Glow */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
                                  </Card>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <SemesterForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={fetchSemesters}
      />

      <SemesterForm
        open={!!editingSemester}
        onOpenChange={(open) => !open && setEditingSemester(null)}
        semester={editingSemester || undefined}
        onSuccess={fetchSemesters}
      />

      <DeleteDialog
        open={!!deletingSemester}
        onOpenChange={(open) => !open && setDeletingSemester(null)}
        title="Delete Semester"
        description={`Are you sure you want to delete "${getSemesterOrdinal(deletingSemester?.number || 0)} Semester" from "${deletingSemester?.program.name}"? This will also delete all associated courses. This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      {selectedSemesterForCourse && (
        <MultiCourseForm
          open={showCourseForm}
          onOpenChange={(open) => {
            setShowCourseForm(open)
            if (!open) setSelectedSemesterForCourse(null)
          }}
          semester={selectedSemesterForCourse}
          onSuccess={fetchSemesters}
        />
      )}

      <SemesterCourseDetailsModal
        open={!!viewingCourse}
        onOpenChange={(open) => !open && setViewingCourse(null)}
        course={viewingCourse}
        onEdit={(course) => {
          setViewingCourse(null)
          handleEditCourse(course)
        }}
      />

      <CourseForm
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        course={editingCourse || undefined}
        onSuccess={() => {
          setEditingCourse(null)
          fetchSemesters()
        }}
      />
    </div>
  )
}
