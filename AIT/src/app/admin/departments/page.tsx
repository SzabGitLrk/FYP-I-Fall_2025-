"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin,
  User,
  Search,
  GraduationCap,
  Building,
  ChevronRight,
  MoreVertical,
  Eye,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface Department {
  id: number
  name: string
  code?: string
  description?: string
  headOfDept?: string
  email?: string
  phone?: string
  location?: string
  _count?: {
    programs: number
    faculty: number
  }
  programs?: Program[]
  faculty?: Faculty[]
  createdAt: string
  updatedAt: string
}

interface Program {
  id: number
  name: string
  code?: string
  description?: string
  duration?: number
  departmentId: number
  semesters?: Semester[]
}

interface Semester {
  id: number
  number: number
  courses?: Course[]
}

interface Course {
  id: number
  name: string
  code?: string
  type: string
  faculty?: Faculty
}

interface Faculty {
  id: number
  name: string
  email: string
  designation?: string
}

interface DepartmentFormData {
  name: string
  code: string
  description: string
  headOfDept: string
  email: string
  phone: string
  location: string
}

const initialFormData: DepartmentFormData = {
  name: '',
  code: '',
  description: '',
  headOfDept: '',
  email: '',
  phone: '',
  location: ''
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<DepartmentFormData>(initialFormData)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/departments?includeStats=true')
      const result = await response.json()
      
      if (result.success) {
        setDepartments(result.data)
      } else {
        toast.error('Failed to fetch departments')
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to fetch departments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const handleCreateDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error('Department name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Department created successfully')
        setIsCreateDialogOpen(false)
        setFormData(initialFormData)
        fetchDepartments()
      } else {
        toast.error(result.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Error creating department:', error)
      toast.error('Failed to create department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditDepartment = async () => {
    if (!editingDepartment || !formData.name.trim()) {
      toast.error('Department name is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Department updated successfully')
        setIsEditDialogOpen(false)
        setEditingDepartment(null)
        setFormData(initialFormData)
        fetchDepartments()
      } else {
        toast.error(result.error || 'Failed to update department')
      }
    } catch (error) {
      console.error('Error updating department:', error)
      toast.error('Failed to update department')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (department: Department) => {
    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Department deleted successfully')
        fetchDepartments()
      } else {
        toast.error(result.error || 'Failed to delete department')
      }
    } catch (error) {
      console.error('Error deleting department:', error)
      toast.error('Failed to delete department')
    }
  }

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      code: department.code || '',
      description: department.description || '',
      headOfDept: department.headOfDept || '',
      email: department.email || '',
      phone: department.phone || '',
      location: department.location || ''
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = async (department: Department) => {
    try {
      console.log('[openViewDialog] Fetching department:', department.id, department.name)
      const response = await fetch(`/api/departments/${department.id}?includePrograms=true&includeFaculty=true`)
      const result = await response.json()
      
      console.log('[openViewDialog] Response:', response.status, result)
      
      if (result.success) {
        setSelectedDepartment(result.data)
        setIsViewDialogOpen(true)
      } else {
        toast.error(result.error || 'Failed to fetch department details')
        console.error('[openViewDialog] Error:', result.error)
      }
    } catch (error) {
      console.error('[openViewDialog] Exception:', error)
      toast.error('Failed to fetch department details')
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.headOfDept?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPrograms = departments.reduce((sum, dept) => sum + (dept._count?.programs || 0), 0)
  const totalFaculty = departments.reduce((sum, dept) => sum + (dept._count?.faculty || 0), 0)

  const gradientColors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-green-500 to-emerald-500',
  ]

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Departments</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage academic departments, programs, and faculty assignments
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              size="lg"
              className="bg-white text-blue-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Department
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
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Departments</p>
                  <p className="text-4xl font-bold">{departments.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Building2 className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Programs</p>
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Faculty Members</p>
                  <p className="text-4xl font-bold">{totalFaculty}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Users className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Heads Assigned</p>
                  <p className="text-4xl font-bold">{departments.filter(d => d.headOfDept).length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                  <User className="h-8 w-8 text-white" />
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
                placeholder="Search departments by name, code, or head..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              {filteredDepartments.length} of {departments.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading departments...</p>
          </div>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No departments found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first department'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Department
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department, index) => (
            <motion.div
              key={department.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-300 h-full group">
                {/* Gradient Top Bar */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradientColors[index % gradientColors.length]}`} />
                
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientColors[index % gradientColors.length]} shadow-lg`}>
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-1 break-words leading-tight">{department.name}</CardTitle>
                        {department.code && (
                          <Badge variant="secondary" className="text-xs">{department.code}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Head of Department */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {department.headOfDept || 'No head assigned'}
                    </span>
                  </div>

                  {/* Location */}
                  {department.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{department.location}</span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {department.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{department.email}</span>
                      </div>
                    )}
                    {department.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{department.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">{department._count?.programs || 0}</span>
                      <span className="text-xs text-muted-foreground">Programs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">{department._count?.faculty || 0}</span>
                      <span className="text-xs text-muted-foreground">Faculty</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDialog(department)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(department._count?.programs || 0) > 0 || (department._count?.faculty || 0) > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{department.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDepartment(department)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-lg`} />
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Department Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Create New Department</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Add a new academic department to the system
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Building2 className="h-4 w-4" />
                Basic Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    Department Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Computer Science"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Department Code
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="CS"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of the department..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Leadership & Location Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <User className="h-4 w-4" />
                Leadership & Location
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headOfDept" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    Head of Department
                  </Label>
                  <Input
                    id="headOfDept"
                    value={formData.headOfDept}
                    onChange={(e) => setFormData({ ...formData, headOfDept: e.target.value })}
                    placeholder="Dr. John Smith"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Building A, Floor 2"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Mail className="h-4 w-4" />
                Contact Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cs@university.edu"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setFormData(initialFormData)
              }}
              className="h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDepartment} 
              disabled={submitting}
              className="h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Department
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit Department</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Update department information and details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Building2 className="h-4 w-4" />
                Basic Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    Department Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Computer Science"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Department Code
                  </Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="CS"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of the department..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Leadership & Location Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <User className="h-4 w-4" />
                Leadership & Location
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-headOfDept" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    Head of Department
                  </Label>
                  <Input
                    id="edit-headOfDept"
                    value={formData.headOfDept}
                    onChange={(e) => setFormData({ ...formData, headOfDept: e.target.value })}
                    placeholder="Dr. John Smith"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Location
                  </Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Building A, Floor 2"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Mail className="h-4 w-4" />
                Contact Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cs@university.edu"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    Phone Number
                  </Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Department Stats (Read-only) */}
            {editingDepartment && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  Department Statistics
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-muted-foreground">Programs</span>
                        </div>
                        <span className="text-2xl font-bold text-purple-600">
                          {editingDepartment._count?.programs || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-medium text-muted-foreground">Faculty</span>
                        </div>
                        <span className="text-2xl font-bold text-emerald-600">
                          {editingDepartment._count?.faculty || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingDepartment(null)
                setFormData(initialFormData)
              }}
              className="h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditDepartment} 
              disabled={submitting}
              className="h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Update Department
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Department Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span>{selectedDepartment?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive department overview
            </DialogDescription>
          </DialogHeader>
          {selectedDepartment && (
            <div className="space-y-6 py-4">
              {/* Department Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code:</span>
                      <span className="font-medium">{selectedDepartment.code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Head:</span>
                      <span className="font-medium">{selectedDepartment.headOfDept || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{selectedDepartment.location || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedDepartment.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedDepartment.phone || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedDepartment.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedDepartment.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Programs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                      Programs
                    </CardTitle>
                    <Badge variant="secondary">{selectedDepartment.programs?.length || 0}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDepartment.programs && selectedDepartment.programs.length > 0 ? (
                    <div className="grid gap-3">
                      {selectedDepartment.programs.map((program) => (
                        <Card key={program.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{program.name}</h4>
                                {program.code && <Badge variant="outline" className="text-xs">{program.code}</Badge>}
                              </div>
                              {program.description && (
                                <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
                              )}
                            </div>
                            <div className="text-right text-sm ml-4">
                              {program.duration && (
                                <div className="font-medium text-purple-600">{program.duration} years</div>
                              )}
                              <div className="text-muted-foreground">
                                {program.semesters?.length || 0} semesters
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">No programs assigned to this department.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Faculty */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600" />
                      Faculty Members
                    </CardTitle>
                    <Badge variant="secondary">{selectedDepartment.faculty?.length || 0}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDepartment.faculty && selectedDepartment.faculty.length > 0 ? (
                    <div className="grid gap-2">
                      {selectedDepartment.faculty.map((faculty) => (
                        <div key={faculty.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                              {faculty.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{faculty.name}</div>
                              <div className="text-sm text-muted-foreground">{faculty.email}</div>
                            </div>
                          </div>
                          {faculty.designation && (
                            <Badge variant="outline">{faculty.designation}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">No faculty assigned to this department.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
