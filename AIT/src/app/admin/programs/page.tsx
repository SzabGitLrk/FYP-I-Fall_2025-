"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-states"
import { ProgramForm } from "@/components/forms/program-form"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import { 
  Plus, 
  GraduationCap, 
  Building2, 
  Calendar, 
  BookOpen, 
  Edit, 
  Trash2, 
  Search,
  Clock,
  Users,
  TrendingUp,
  Layers,
  ChevronRight,
  Eye,
  Sparkles,
  Award
} from "lucide-react"
import { toast } from "sonner"
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
  description?: string
  duration?: number
  departmentId: number
  department?: Department
  createdAt: string
  semesters: Array<{
    id: number
    number: number
    courses: Array<{ id: number }>
  }>
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (result.success) {
        setPrograms(result.data)
      } else {
        toast.error('Failed to fetch programs')
      }
    } catch (error) {
      toast.error('Failed to fetch programs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProgram) return
    
    try {
      const response = await fetch(`/api/programs/${deletingProgram.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Program deleted successfully')
        fetchPrograms()
      } else {
        toast.error(result.error || 'Failed to delete program')
      }
    } catch (error) {
      toast.error('Failed to delete program')
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  const handleEdit = (program: Program) => {
    setEditingProgram(program)
  }

  const handleDeleteClick = (program: Program) => {
    setDeletingProgram(program)
  }

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         program.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === 'all' || program.departmentId.toString() === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const departments = Array.from(new Set(programs.map(p => p.department).filter(Boolean)))
  const totalSemesters = programs.reduce((sum, p) => sum + p.semesters.length, 0)
  const totalCourses = programs.reduce((sum, p) => 
    sum + p.semesters.reduce((s, sem) => s + sem.courses.length, 0), 0
  )
  const avgDuration = programs.length > 0 
    ? (programs.reduce((sum, p) => sum + (p.duration || 0), 0) / programs.length).toFixed(1)
    : 0

  const gradientColors = [
    'from-violet-500 to-purple-500',
    'from-blue-500 to-indigo-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-emerald-500',
    'from-green-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-fuchsia-500 to-purple-500',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading programs..." />
      </div>
    )
  }

  if (programs.length === 0 && !showCreateForm) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Programs</h1>
            </div>
            <p className="text-white/90 text-lg">Manage academic degree programs</p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="No programs found"
          description="Get started by creating your first academic program"
          action={{
            label: "Add Program",
            onClick: () => setShowCreateForm(true)
          }}
        />
        <ProgramForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={fetchPrograms}
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Academic Programs</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage degree programs, semesters, and curriculum structure
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Program
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
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-violet-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Programs</p>
                  <p className="text-4xl font-bold">{programs.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500">
                  <Award className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Semesters</p>
                  <p className="text-4xl font-bold">{totalSemesters}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Layers className="h-8 w-8 text-white" />
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
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg Duration</p>
                  <p className="text-4xl font-bold">{avgDuration}</p>
                  <p className="text-xs text-muted-foreground mt-1">years</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search programs by name, code, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              {filteredPrograms.length} of {programs.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No programs found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first program'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program, index) => {
            const totalCoursesInProgram = program.semesters.reduce((sum, sem) => sum + sem.courses.length, 0)
            const gradient = gradientColors[index % gradientColors.length]
            
            return (
              <motion.div
                key={program.id}
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
                        <GraduationCap className="h-6 w-6 text-white" />
                      </div>
                      {program.code && (
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {program.code}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-2 line-clamp-2">{program.name}</CardTitle>
                    {program.department && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{program.department.name}</span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Description */}
                    {program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {program.description}
                      </p>
                    )}

                    {/* Duration */}
                    {program.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{program.duration} years</span>
                        <span className="text-muted-foreground">duration</span>
                      </div>
                    )}

                    {/* Semester Timeline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Semesters</span>
                        <Badge variant="outline">{program.semesters.length}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {program.semesters.slice(0, 8).map((semester) => (
                          <div
                            key={semester.id}
                            className={`relative group/sem`}
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer`}>
                              {semester.number}
                            </div>
                            {semester.courses.length > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                                {semester.courses.length}
                              </div>
                            )}
                          </div>
                        ))}
                        {program.semesters.length > 8 && (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs">
                            +{program.semesters.length - 8}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium">{totalCoursesInProgram}</span>
                        <span className="text-xs text-muted-foreground">Courses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{program.semesters.length}</span>
                        <span className="text-xs text-muted-foreground">Semesters</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(program)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(program)}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      <ProgramForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={fetchPrograms}
      />

      <ProgramForm
        open={!!editingProgram}
        onOpenChange={(open) => !open && setEditingProgram(null)}
        program={editingProgram || undefined}
        onSuccess={fetchPrograms}
      />

      <DeleteDialog
        open={!!deletingProgram}
        onOpenChange={(open) => !open && setDeletingProgram(null)}
        title="Delete Program"
        description={
          deletingProgram 
            ? `Are you sure you want to delete "${deletingProgram.name}"?\n\nThis will permanently delete:\n• ${deletingProgram.semesters.length} semester${deletingProgram.semesters.length !== 1 ? 's' : ''}\n• ${deletingProgram.semesters.reduce((sum, sem) => sum + sem.courses.length, 0)} course${deletingProgram.semesters.reduce((sum, sem) => sum + sem.courses.length, 0) !== 1 ? 's' : ''}\n\nThis action cannot be undone.`
            : ''
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
