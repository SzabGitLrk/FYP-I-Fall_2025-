"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  BookMarked, 
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Users
} from "lucide-react"
import { toast } from "sonner"
import { CourseType } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

interface BulkCourse {
  id: string
  name: string
  code: string
  type: CourseType
  semesterId: number
  facultyId?: number
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface Program {
  id: number
  name: string
  code?: string
  semesters: Array<{
    id: number
    number: number
  }>
}

interface Faculty {
  id: number
  name: string
  email: string
}

interface BulkCourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultSemesterId?: number
}

export function BulkCourseForm({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultSemesterId 
}: BulkCourseFormProps) {
  const [courses, setCourses] = useState<BulkCourse[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [csvInput, setCsvInput] = useState("")
  const [showCsvInput, setShowCsvInput] = useState(false)

  const fetchData = async () => {
    try {
      const [programsResponse, facultyResponse] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/faculty')
      ])
      
      const [programsResult, facultyResult] = await Promise.all([
        programsResponse.json(),
        facultyResponse.json()
      ])
      
      if (programsResult.success) {
        setPrograms(programsResult.data)
      }
      
      if (facultyResult.success) {
        setFaculty(facultyResult.data)
      }
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchData()
      setCourses([])
      setCsvInput("")
      setShowCsvInput(false)
    }
  }, [open])

  const addEmptyCourse = () => {
    const newCourse: BulkCourse = {
      id: Date.now().toString(),
      name: "",
      code: "",
      type: CourseType.THEORY,
      semesterId: defaultSemesterId || 0,
      status: 'pending'
    }
    setCourses([...courses, newCourse])
  }

  const updateCourse = (id: string, updates: Partial<BulkCourse>) => {
    setCourses(courses.map(course => 
      course.id === id 
        ? { ...course, ...updates, status: 'pending' as const }
        : course
    ))
  }

  const removeCourse = (id: string) => {
    setCourses(courses.filter(course => course.id !== id))
  }

  const parseCsvInput = () => {
    if (!csvInput.trim()) {
      toast.error("Please enter CSV data")
      return
    }

    try {
      const lines = csvInput.trim().split('\n')
      const newCourses: BulkCourse[] = []

      lines.forEach((line, index) => {
        const [name, code, type, semesterName] = line.split(',').map(s => s.trim())
        
        if (!name) return

        // Find semester by program name (basic matching)
        const semester = programs.flatMap(p => 
          p.semesters.map(s => ({ ...s, program: p }))
        ).find(s => 
          s.program.name.toLowerCase().includes(semesterName?.toLowerCase() || '') ||
          semesterName?.includes(s.program.name)
        )

        const courseType = type?.toLowerCase() === 'lab' ? CourseType.LAB : CourseType.THEORY

        newCourses.push({
          id: `csv-${Date.now()}-${index}`,
          name: name,
          code: code || "",
          type: courseType,
          semesterId: semester?.id || defaultSemesterId || 0,
          status: 'pending'
        })
      })

      setCourses([...courses, ...newCourses])
      setCsvInput("")
      setShowCsvInput(false)
      toast.success(`Added ${newCourses.length} courses from CSV`)
    } catch (error) {
      toast.error("Failed to parse CSV data")
    }
  }

  const createAllCourses = async () => {
    if (courses.length === 0) {
      toast.error("No courses to create")
      return
    }

    // Validate all courses
    const invalidCourses = courses.filter(course => 
      !course.name.trim() || !course.semesterId
    )

    if (invalidCourses.length > 0) {
      toast.error(`${invalidCourses.length} courses have missing required fields`)
      return
    }

    setIsCreating(true)
    let successCount = 0
    let errorCount = 0

    // Create courses one by one to handle individual errors
    for (const course of courses) {
      try {
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: course.name,
            code: course.code || null,
            type: course.type,
            semesterId: course.semesterId,
            facultyId: course.facultyId || null,
          }),
        })

        const result = await response.json()

        if (result.success) {
          updateCourse(course.id, { status: 'success' })
          successCount++
        } else {
          updateCourse(course.id, { 
            status: 'error', 
            error: result.error || 'Failed to create course' 
          })
          errorCount++
        }
      } catch (error) {
        updateCourse(course.id, { 
          status: 'error', 
          error: 'Network error' 
        })
        errorCount++
      }
    }

    setIsCreating(false)

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} courses`)
      if (errorCount === 0) {
        onSuccess()
        onOpenChange(false)
      }
    }

    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} courses`)
    }
  }

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const allSemesters = programs.flatMap(program => 
    program.semesters.map(semester => ({
      ...semester,
      program
    }))
  )

  const downloadTemplate = () => {
    const csvContent = [
      "Course Name,Course Code,Type,Program",
      "Data Structures,CS201,Theory,Computer Science",
      "Database Lab,CS202,Lab,Computer Science",
      "Calculus I,MATH101,Theory,Mathematics"
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_courses_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Create Courses
          </DialogTitle>
          <DialogDescription>
            Create multiple courses at once by adding them individually or importing from CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addEmptyCourse}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCsvInput(!showCsvInput)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>

            <div className="ml-auto">
              <Badge variant="outline">
                {courses.length} courses
              </Badge>
            </div>
          </div>

          {/* CSV Input */}
          <AnimatePresence>
            {showCsvInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">CSV Import</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="csv-input">CSV Data</Label>
                      <Textarea
                        id="csv-input"
                        placeholder="Course Name,Course Code,Type,Program&#10;Data Structures,CS201,Theory,Computer Science&#10;Database Lab,CS202,Lab,Computer Science"
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        className="min-h-[100px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: Course Name, Course Code, Type (Theory/Lab), Program Name
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={parseCsvInput}
                        disabled={!csvInput.trim()}
                      >
                        Parse CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCsvInput("")
                          setShowCsvInput(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Courses List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {courses.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No courses added</h3>
                    <p className="text-muted-foreground mb-4">
                      Add courses individually or import from CSV to get started.
                    </p>
                    <Button onClick={addEmptyCourse} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Course
                    </Button>
                  </div>
                </Card>
              ) : (
                courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`relative ${
                      course.status === 'success' ? 'border-green-200 bg-green-50/50' :
                      course.status === 'error' ? 'border-red-200 bg-red-50/50' :
                      'border-border'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Status Indicator */}
                          <div className="mt-2">
                            {course.status === 'success' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {course.status === 'error' && (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            {course.status === 'pending' && (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>

                          {/* Course Form */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Course Name *</Label>
                              <Input
                                placeholder="Course name"
                                value={course.name}
                                onChange={(e) => updateCourse(course.id, { name: e.target.value })}
                                disabled={course.status === 'success'}
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Course Code</Label>
                              <Input
                                placeholder="Code"
                                value={course.code}
                                onChange={(e) => updateCourse(course.id, { code: e.target.value })}
                                disabled={course.status === 'success'}
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={course.type}
                                onValueChange={(value: CourseType) => updateCourse(course.id, { type: value })}
                                disabled={course.status === 'success'}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={CourseType.THEORY}>
                                    <div className="flex items-center gap-2">
                                      <BookMarked className="h-3 w-3" />
                                      Theory
                                    </div>
                                  </SelectItem>
                                  <SelectItem value={CourseType.LAB}>
                                    <div className="flex items-center gap-2">
                                      <FlaskConical className="h-3 w-3" />
                                      Lab
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Semester *</Label>
                              <Select
                                value={course.semesterId.toString()}
                                onValueChange={(value) => updateCourse(course.id, { semesterId: parseInt(value) })}
                                disabled={course.status === 'success' || loadingData}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allSemesters.map((semester) => (
                                    <SelectItem key={semester.id} value={semester.id.toString()}>
                                      {semester.program.name} - {getSemesterOrdinal(semester.number)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(course.id)}
                            disabled={course.status === 'success'}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Error Message */}
                        {course.status === 'error' && course.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {course.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={createAllCourses}
            disabled={isCreating || courses.length === 0 || loadingData}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create {courses.length} Courses
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}