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
import { EnhancedFacultyForm } from "@/components/forms/enhanced-faculty-form"
import { BulkFacultyForm } from "@/components/forms/bulk-faculty-form"
import { FacultyDetailsModal } from "@/components/modals/faculty-details-modal"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { 
  Plus, 
  User, 
  Mail, 
  BookOpen, 
  Users,
  Edit,
  Trash2,
  Search,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Briefcase,
  ChevronDown,
  Eye,
  Upload,
  Sparkles,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

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
}

interface Faculty {
  id: number
  name: string
  email: string
  phone?: string
  designation?: string
  employmentType?: string
  department?: {
    id: number
    name: string
    code?: string
  }
  createdAt: string
  courses: Course[]
  timetable: Array<{ id: number }>
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null)
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'unassigned'>('all')

  const fetchFaculty = async () => {
    try {
      const response = await fetch('/api/faculty')
      const result = await response.json()
      
      if (result.success) {
        setFaculty(result.data)
      } else {
        toast.error('Failed to fetch faculty')
      }
    } catch (error) {
      toast.error('Failed to fetch faculty')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingFaculty) return
    
    try {
      const response = await fetch(`/api/faculty/${deletingFaculty.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Faculty member deleted successfully')
        fetchFaculty()
      } else {
        toast.error(result.error || 'Failed to delete faculty member')
      }
    } catch (error) {
      toast.error('Failed to delete faculty member')
    }
  }

  useEffect(() => {
    fetchFaculty()
  }, [])

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const handleEdit = (fac: Faculty) => {
    setEditingFaculty(fac)
  }

  const handleView = (fac: Faculty) => {
    setViewingFaculty(fac)
  }

  const handleDeleteClick = (fac: Faculty) => {
    setDeletingFaculty(fac)
  }

  // Filter faculty
  const filteredFaculty = faculty.filter(fac => {
    const matchesSearch = fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fac.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fac.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fac.department?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fac.courses.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              c.code.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'assigned' && fac.courses.length > 0) ||
                      (activeTab === 'unassigned' && fac.courses.length === 0)
    
    return matchesSearch && matchesTab
  })

  // Statistics
  const assignedFaculty = faculty.filter(f => f.courses.length > 0)
  const unassignedFaculty = faculty.filter(f => f.courses.length === 0)
  const scheduledFaculty = faculty.filter(f => f.timetable.length > 0)
  const totalCourses = faculty.reduce((sum, f) => sum + f.courses.length, 0)

  const facultyGradients = [
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
        <LoadingSpinner size="lg" text="Loading faculty..." />
      </div>
    )
  }

  if (faculty.length === 0 && !showCreateForm) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Faculty</h1>
            </div>
            <p className="text-white/90 text-lg">Manage teaching staff and course assignments</p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No faculty members found"
          description="Get started by adding your first faculty member"
          action={{
            label: "Add Faculty",
            onClick: () => setShowEnhancedForm(true)
          }}
        />
        <EnhancedFacultyForm
          open={showEnhancedForm}
          onOpenChange={setShowEnhancedForm}
          onSuccess={fetchFaculty}
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Faculty</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage teaching staff, assign courses, and track schedules
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-white/90 shadow-lg gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Faculty
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Add Faculty Member</DropdownMenuLabel>
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
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Faculty</p>
                  <p className="text-4xl font-bold">{faculty.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500">
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Assigned</p>
                  <p className="text-4xl font-bold">{assignedFaculty.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <UserCheck className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Courses</p>
                  <p className="text-4xl font-bold">{totalCourses}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled</p>
                  <p className="text-4xl font-bold">{scheduledFaculty.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                  <Calendar className="h-8 w-8 text-white" />
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
                placeholder="Search by name, email, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all" className="gap-2">
                  <Users className="h-4 w-4" />
                  All ({faculty.length})
                </TabsTrigger>
                <TabsTrigger value="assigned" className="gap-2">
                  <UserCheck className="h-4 w-4" />
                  Assigned ({assignedFaculty.length})
                </TabsTrigger>
                <TabsTrigger value="unassigned" className="gap-2">
                  <User className="h-4 w-4" />
                  Unassigned ({unassignedFaculty.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Faculty Grid */}
      {filteredFaculty.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No faculty members found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first faculty member'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowEnhancedForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Faculty
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((fac, index) => {
            const gradient = facultyGradients[index % facultyGradients.length]
            const isScheduled = fac.timetable.length > 0
            const courseCount = fac.courses.length
            
            return (
              <motion.div
                key={fac.id}
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
                        {fac.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {courseCount > 0 ? (
                          <Badge variant="default" className="bg-emerald-500">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <User className="h-3 w-3 mr-1" />
                            Unassigned
                          </Badge>
                        )}
                        {isScheduled ? (
                          <Badge variant="default" className="bg-blue-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Scheduled
                          </Badge>
                        )}
                        {fac.employmentType && (
                          <Badge variant="outline" className="text-xs">
                            {fac.employmentType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{fac.name}</CardTitle>
                    {fac.designation && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {fac.designation}
                      </Badge>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{fac.email}</span>
                      </div>
                      {fac.department && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span className="truncate">{fac.department.name}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Course Stats */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{courseCount}</p>
                          <p className="text-xs text-muted-foreground">Assigned Courses</p>
                        </div>
                      </div>
                      
                      {/* Course List */}
                      {courseCount > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {fac.courses.slice(0, 3).map((course) => (
                            <div key={course.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50">
                              <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{course.code}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {course.semester.program.name} - {getSemesterOrdinal(course.semester.number)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {courseCount > 3 && (
                            <p className="text-xs text-center text-muted-foreground py-1">
                              +{courseCount - 3} more courses
                            </p>
                          )}
                        </div>
                      )}
                      
                      {courseCount === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground italic">
                          No courses assigned yet
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(fac)}
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
                          <DropdownMenuItem onClick={() => handleEdit(fac)} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Faculty
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(fac)}
                            disabled={courseCount > 0}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Faculty
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

      <EnhancedFacultyForm
        open={showEnhancedForm}
        onOpenChange={setShowEnhancedForm}
        onSuccess={fetchFaculty}
      />

      <BulkFacultyForm
        open={showBulkForm}
        onOpenChange={setShowBulkForm}
        onSuccess={fetchFaculty}
      />

      <EnhancedFacultyForm
        open={!!editingFaculty}
        onOpenChange={(open) => !open && setEditingFaculty(null)}
        faculty={editingFaculty || undefined}
        onSuccess={fetchFaculty}
      />

      <FacultyDetailsModal
        open={!!viewingFaculty}
        onOpenChange={(open) => !open && setViewingFaculty(null)}
        faculty={viewingFaculty}
        onEdit={(faculty) => {
          setViewingFaculty(null)
          handleEdit(faculty)
        }}
      />

      <DeleteDialog
        open={!!deletingFaculty}
        onOpenChange={(open) => !open && setDeletingFaculty(null)}
        title="Delete Faculty Member"
        description={`Are you sure you want to delete "${deletingFaculty?.name}"? ${
          deletingFaculty?.courses.length ? 
          'This faculty member is assigned to courses and cannot be deleted. Please reassign or remove the courses first.' :
          'This action cannot be undone.'
        }`}
        onConfirm={handleDelete}
      />
    </div>
  )
}