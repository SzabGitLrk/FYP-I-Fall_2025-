"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Department {
  id: number
  name: string
  code?: string
}

interface Program {
  id: number
  name: string
  code?: string
  departmentId: number
}

interface Semester {
  id: number
  number: number
  programId: number
}

interface Student {
  id: number
  regId: string
  regName: string
  programId?: number
}

interface Course {
  id: number
  name: string
  code?: string
  type: string
  semester: {
    id: number
    number: number
    programId: number
  }
}

interface EnrollmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preSelectedStudentId?: number
}

export function EnrollmentForm({ open, onOpenChange, onSuccess, preSelectedStudentId }: EnrollmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [allProgramCourses, setAllProgramCourses] = useState<Course[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([])
  const [studentEnrolledCourses, setStudentEnrolledCourses] = useState<Course[]>([])
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])
  
  // Determine if we're in pre-selected mode
  const isPreSelectedMode = !!preSelectedStudentId

  // Fetch pre-selected student data and their enrollments
  useEffect(() => {
    const fetchPreSelectedStudent = async () => {
      if (!preSelectedStudentId) return
      
      try {
        // Fetch student details with enrollments
        const studentResponse = await fetch(`/api/students/${preSelectedStudentId}`)
        const studentResult = await studentResponse.json()
        
        if (studentResult.success && studentResult.data) {
          const student = studentResult.data
          setSelectedStudentId(student.id)
          setSelectedProgramId(student.programId)
          
          // Extract enrolled course IDs to filter them out
          const enrolledIds = student.enrollments?.map((e: any) => e.courseId) || []
          setEnrolledCourseIds(enrolledIds)
        }
      } catch (error) {
        toast.error('Failed to fetch student data')
      }
    }

    if (open && preSelectedStudentId) {
      fetchPreSelectedStudent()
    }
  }, [open, preSelectedStudentId])

  // Fetch departments (only in non-preselected mode)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments')
        const result = await response.json()
        if (result.success) {
          setDepartments(result.data)
        }
      } catch (error) {
        toast.error('Failed to fetch departments')
      }
    }

    if (open && !isPreSelectedMode) {
      fetchDepartments()
    }
  }, [open, isPreSelectedMode])

  // Fetch programs when department is selected
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs')
        const result = await response.json()
        if (result.success) {
          const filteredPrograms = result.data.filter(
            (p: Program) => p.departmentId === selectedDepartmentId
          )
          setPrograms(filteredPrograms)
        }
      } catch (error) {
        toast.error('Failed to fetch programs')
      }
    }

    if (selectedDepartmentId) {
      fetchPrograms()
      // Reset dependent selections
      setSelectedProgramId(null)
      setSelectedSemesterId(null)
      setSelectedStudentId(null)
      setSelectedCourseIds([])
      // Clear dependent data
      setSemesters([])
      setStudents([])
      setCourses([])
    } else {
      // Clear programs when no department is selected
      setPrograms([])
      setSemesters([])
      setStudents([])
      setCourses([])
    }
  }, [selectedDepartmentId])

  // Fetch semesters when program is selected
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await fetch('/api/semesters')
        const result = await response.json()
        if (result.success) {
          const filteredSemesters = result.data.filter(
            (s: any) => s.programId === selectedProgramId
          )
          setSemesters(filteredSemesters)
        }
      } catch (error) {
        toast.error('Failed to fetch semesters')
      }
    }

    if (selectedProgramId && !isPreSelectedMode) {
      fetchSemesters()
      // Reset dependent selections
      setSelectedSemesterId(null)
      setSelectedStudentId(null)
      setSelectedCourseIds([])
      // Clear dependent data
      setStudents([])
      setCourses([])
    } else if (!selectedProgramId && !isPreSelectedMode) {
      // Clear semesters when no program is selected
      setSemesters([])
      setStudents([])
      setCourses([])
    }
  }, [selectedProgramId, isPreSelectedMode])

  // Fetch students when semester is selected
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/students/by-semester?semesterId=${selectedSemesterId}`)
        const result = await response.json()
        if (result.success) {
          setStudents(result.data)
        }
      } catch (error) {
        toast.error('Failed to fetch students')
      }
    }

    if (selectedSemesterId && !isPreSelectedMode) {
      fetchStudents()
      // Reset dependent selections
      setSelectedStudentId(null)
      setSelectedCourseIds([])
      // Clear dependent data
      setCourses([])
    } else if (!selectedSemesterId && !isPreSelectedMode) {
      // Clear students when no semester is selected
      setStudents([])
      setCourses([])
    }
  }, [selectedSemesterId, isPreSelectedMode])

  // Fetch student's already enrolled courses when student is selected
  useEffect(() => {
    const fetchStudentEnrollments = async () => {
      if (!selectedStudentId) {
        setStudentEnrolledCourses([])
        setSelectedCourseIds([])
        return
      }

      try {
        const response = await fetch(`/api/students/${selectedStudentId}`)
        const result = await response.json()
        
        if (result.success && result.data?.enrollments) {
          // Get the courses the student is already enrolled in
          const enrolledCourses = result.data.enrollments.map((e: any) => e.course)
          setStudentEnrolledCourses(enrolledCourses)
          
          // Initialize selected courses with already enrolled courses
          const enrolledCourseIds = enrolledCourses.map((c: Course) => c.id)
          setSelectedCourseIds(enrolledCourseIds)
        }
      } catch (error) {
        console.error('Failed to fetch student enrollments:', error)
      }
    }

    fetchStudentEnrollments()
  }, [selectedStudentId])

  // Fetch courses when semester is selected
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        const result = await response.json()
        if (result.success) {
          // Filter courses by semester
          let filteredCourses = result.data.filter(
            (c: Course) => c.semester.id === selectedSemesterId
          )
          
          // In pre-selected mode, filter out already enrolled courses
          if (isPreSelectedMode && enrolledCourseIds.length > 0) {
            filteredCourses = filteredCourses.filter(
              (c: Course) => !enrolledCourseIds.includes(c.id)
            )
          }
          
          setCourses(filteredCourses)
          
          // Also fetch all courses in the program
          const allProgramCoursesFiltered = result.data.filter(
            (c: Course) => c.semester.programId === selectedProgramId
          )
          setAllProgramCourses(allProgramCoursesFiltered)
        }
      } catch (error) {
        toast.error('Failed to fetch courses')
      }
    }

    if (selectedSemesterId) {
      fetchCourses()
    }
  }, [selectedSemesterId, selectedProgramId, isPreSelectedMode, enrolledCourseIds])

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student')
      return
    }

    if (selectedCourseIds.length === 0 && studentEnrolledCourses.length === 0) {
      toast.error('Please select at least one course or keep existing enrollments')
      return
    }

    setIsLoading(true)
    try {
      // Validate new enrollments for conflicts before proceeding
      const newCourseIds = selectedCourseIds.filter(
        id => !studentEnrolledCourses.some(c => c.id === id)
      )
      
      let hasValidationErrors = false
      const validationResults = []
      
      // Validate each new course enrollment
      for (const courseId of newCourseIds) {
        try {
          const validationResponse = await fetch(`/api/students/${selectedStudentId}/validate-enrollment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ courseId }),
          })
          
          const validationResult = await validationResponse.json()
          validationResults.push(validationResult)
          
          if (validationResult.success && !validationResult.data.validation.isValid) {
            hasValidationErrors = true
            const errors = validationResult.data.validation.errors
            toast.error(`Enrollment validation failed for course: ${errors.join(', ')}`)
          }
        } catch (error) {
          console.error('Validation error:', error)
          // Continue with enrollment if validation fails
        }
      }
      
      // Show warnings but allow enrollment to continue
      const warnings = validationResults
        .filter(r => r.success && r.data.validation.warnings.length > 0)
        .flatMap(r => r.data.validation.warnings)
      
      if (warnings.length > 0) {
        toast.warning(`Enrollment warnings: ${warnings.slice(0, 2).join(', ')}${warnings.length > 2 ? '...' : ''}`)
      }
      
      // If there are critical errors, ask for confirmation
      if (hasValidationErrors) {
        const proceed = window.confirm(
          'There are validation errors with this enrollment. Do you want to proceed anyway? This may create schedule conflicts.'
        )
        if (!proceed) {
          setIsLoading(false)
          return
        }
      }

      const enrollmentPromises: Promise<Response>[] = []
      const unenrollmentPromises: Promise<Response>[] = []

      // Handle new enrollments - courses selected that aren't already enrolled
      newCourseIds.forEach(courseId => {
        enrollmentPromises.push(
          fetch('/api/enrollments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: selectedStudentId,
              courseId: courseId,
            }),
          })
        )
      })

      // Handle unenrollments - courses that were enrolled but are no longer selected
      const coursesToUnenroll = studentEnrolledCourses.filter(
        c => !selectedCourseIds.includes(c.id)
      )
      
      coursesToUnenroll.forEach(course => {
        unenrollmentPromises.push(
          fetch('/api/enrollments', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: selectedStudentId,
              courseId: course.id,
            }),
          })
        )
      })

      // Execute all promises
      const allPromises = [...enrollmentPromises, ...unenrollmentPromises]
      const responses = await Promise.all(allPromises)
      const results = await Promise.all(responses.map(r => r.json()))

      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} enrollment(s)`)
        
        // Refresh student schedule after successful enrollment
        if (newCourseIds.length > 0) {
          try {
            await fetch(`/api/students/${selectedStudentId}/schedule`, {
              method: 'POST'
            })
            toast.success('Student schedule updated')
          } catch (error) {
            console.error('Failed to update student schedule:', error)
          }
        }
      }
      if (failCount > 0) {
        toast.error(`Failed to update ${failCount} enrollment(s)`)
      }

      if (successCount > 0) {
        handleReset()
        onOpenChange(false)
        onSuccess()
      }
    } catch (error) {
      toast.error('Failed to update enrollments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (!isPreSelectedMode) {
      setSelectedDepartmentId(null)
      setSelectedProgramId(null)
      setSelectedSemesterId(null)
      setSelectedStudentId(null)
      setDepartments([])
      setPrograms([])
      setSemesters([])
      setStudents([])
    }
    setSelectedCourseIds([])
    setEnrolledCourseIds([])
    setCourses([])
    setAllProgramCourses([])
    setStudentEnrolledCourses([])
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      handleReset()
    }
  }, [open])

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>
            {isPreSelectedMode ? 'Enroll in More Courses' : 'Enroll Student in Course'}
          </DialogTitle>
          <DialogDescription>
            {isPreSelectedMode 
              ? 'Select courses to enroll the student in.'
              : 'Select a student and course to create an enrollment.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-visible">
          {/* Only show department/program/student selection in non-preselected mode */}
          {!isPreSelectedMode && (
            <>
              {/* Department Selection */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={selectedDepartmentId?.toString() || ""}
                  onValueChange={(value) => setSelectedDepartmentId(parseInt(value))}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.code ? `${dept.code} - ${dept.name}` : dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Program Selection */}
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <Select
                  value={selectedProgramId?.toString() || ""}
                  onValueChange={(value) => setSelectedProgramId(parseInt(value))}
                  disabled={!selectedDepartmentId}
                >
                  <SelectTrigger id="program">
                    <SelectValue placeholder={!selectedDepartmentId ? "Select department first" : "Select a program"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.code ? `${program.code} - ${program.name}` : program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semester Selection */}
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={selectedSemesterId?.toString() || ""}
                  onValueChange={(value) => setSelectedSemesterId(parseInt(value))}
                  disabled={!selectedProgramId}
                >
                  <SelectTrigger id="semester">
                    <SelectValue placeholder={!selectedProgramId ? "Select program first" : "Select a semester"} />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.number === 1 ? '1st' : semester.number === 2 ? '2nd' : semester.number === 3 ? '3rd' : `${semester.number}th`} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selection */}
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select
                  value={selectedStudentId?.toString() || ""}
                  onValueChange={(value) => setSelectedStudentId(parseInt(value))}
                  disabled={!selectedSemesterId}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder={!selectedSemesterId ? "Select semester first" : "Select a student"} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.regId} - {student.regName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Already Enrolled Courses */}
              {selectedStudentId && studentEnrolledCourses.length > 0 && (
                <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <Label className="text-amber-900 dark:text-amber-100">Already Enrolled Courses (Uncheck to unenroll)</Label>
                  <div className="space-y-2">
                    {studentEnrolledCourses.map((course) => (
                      <div key={course.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`enrolled-course-${course.id}`}
                          checked={selectedCourseIds.includes(course.id)}
                          onCheckedChange={() => toggleCourse(course.id)}
                          defaultChecked={true}
                        />
                        <label
                          htmlFor={`enrolled-course-${course.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {course.code || course.name} - {course.type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Course Selection */}
          <div className="space-y-2">
            <Label>Courses in Selected Semester * (Select multiple)</Label>
            <div className="border rounded-md p-4 max-h-[250px] overflow-y-auto space-y-2">
              {!selectedStudentId ? (
                <p className="text-sm text-muted-foreground">
                  {isPreSelectedMode ? 'Loading student data...' : 'Select a student first'}
                </p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isPreSelectedMode 
                    ? 'No additional courses available. Student is already enrolled in all program courses.'
                    : 'No courses available for this semester'}
                </p>
              ) : (
                courses.map((course) => {
                  const isAlreadyEnrolled = studentEnrolledCourses.some(c => c.id === course.id)
                  return (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={selectedCourseIds.includes(course.id)}
                        onCheckedChange={() => toggleCourse(course.id)}
                      />
                      <label
                        htmlFor={`course-${course.id}`}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 ${
                          isAlreadyEnrolled ? 'text-amber-600 dark:text-amber-400' : ''
                        }`}
                      >
                        {course.code || course.name} - {course.type} (Semester {course.semester.number})
                        {isAlreadyEnrolled && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(Already enrolled)</span>}
                      </label>
                    </div>
                  )
                })
              )}
            </div>
            {selectedCourseIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedCourseIds.length} course(s) selected
                </Badge>
              </div>
            )}
          </div>

          {/* Other Program Courses */}
          {selectedStudentId && allProgramCourses.length > courses.length && (
            <div className="space-y-2">
              <Label>Other Courses in {selectedProgramId ? 'Program' : ''} (Optional)</Label>
              <div className="border rounded-md p-4 max-h-[250px] overflow-y-auto space-y-2 bg-blue-50 dark:bg-blue-950/20">
                {allProgramCourses
                  .filter(course => !courses.find(c => c.id === course.id))
                  .map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`other-course-${course.id}`}
                        checked={selectedCourseIds.includes(course.id)}
                        onCheckedChange={() => toggleCourse(course.id)}
                      />
                      <label
                        htmlFor={`other-course-${course.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {course.code || course.name} - {course.type} (Semester {course.semester.number})
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
