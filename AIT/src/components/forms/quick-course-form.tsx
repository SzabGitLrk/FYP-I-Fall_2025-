"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Zap, 
  BookMarked, 
  FlaskConical,
  GraduationCap,
  User,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { CourseType } from "@/lib/types"

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

interface QuickCourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultSemesterId?: number
}

export function QuickCourseForm({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultSemesterId 
}: QuickCourseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Form state
  const [courseName, setCourseName] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [courseType, setCourseType] = useState<CourseType>(CourseType.THEORY)
  const [semesterId, setSemesterId] = useState<number>(defaultSemesterId || 0)
  const [facultyId, setFacultyId] = useState<number | undefined>()

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
      // Reset form
      setCourseName("")
      setCourseCode("")
      setCourseType(CourseType.THEORY)
      setSemesterId(defaultSemesterId || 0)
      setFacultyId(undefined)
    }
  }, [open, defaultSemesterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseName.trim()) {
      toast.error("Course name is required")
      return
    }
    
    if (!semesterId) {
      toast.error("Please select a semester")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: courseName.trim(),
          code: courseCode.trim() || null,
          type: courseType,
          semesterId: semesterId,
          facultyId: facultyId || null,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Something went wrong')
      }

      toast.success('Course created successfully')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
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

  const selectedSemester = allSemesters.find(s => s.id === semesterId)
  const selectedFaculty = faculty.find(f => f.id === facultyId)

  // Auto-generate course code suggestion
  const generateCodeSuggestion = () => {
    if (!courseName || !selectedSemester) return ""
    
    const programCode = selectedSemester.program.code || 
                       selectedSemester.program.name.split(' ').map(w => w[0]).join('').toUpperCase()
    const courseWords = courseName.split(' ').filter(w => w.length > 2)
    const courseAbbrev = courseWords.slice(0, 2).map(w => w[0]).join('').toUpperCase()
    const semesterNum = selectedSemester.number
    
    return `${programCode}${semesterNum}${courseAbbrev}`
  }

  const suggestedCode = generateCodeSuggestion()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Create Course
          </DialogTitle>
          <DialogDescription>
            Rapidly add a new course with essential information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="course-name">Course Name *</Label>
            <Input
              id="course-name"
              placeholder="e.g., Data Structures and Algorithms"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Course Code with Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="course-code">Course Code</Label>
              {suggestedCode && !courseCode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCourseCode(suggestedCode)}
                  className="text-xs h-6 px-2"
                >
                  Use: {suggestedCode}
                </Button>
              )}
            </div>
            <Input
              id="course-code"
              placeholder="e.g., CS201"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
            />
          </div>

          {/* Course Type */}
          <div className="space-y-2">
            <Label>Course Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={courseType === CourseType.THEORY ? "default" : "outline"}
                onClick={() => setCourseType(CourseType.THEORY)}
                className="justify-start gap-2"
              >
                <BookMarked className="h-4 w-4" />
                Theory
              </Button>
              <Button
                type="button"
                variant={courseType === CourseType.LAB ? "default" : "outline"}
                onClick={() => setCourseType(CourseType.LAB)}
                className="justify-start gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                Lab
              </Button>
            </div>
          </div>

          {/* Semester Selection */}
          <div className="space-y-2">
            <Label>Semester *</Label>
            <Select 
              value={semesterId.toString()} 
              onValueChange={(value) => setSemesterId(parseInt(value))}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Loading..." : "Select semester"} />
              </SelectTrigger>
              <SelectContent>
                {allSemesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {semester.program.name} - {getSemesterOrdinal(semester.number)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSemester && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedSemester.program.name} - {getSemesterOrdinal(selectedSemester.number)} Semester
              </div>
            )}
          </div>

          {/* Faculty Assignment */}
          <div className="space-y-2">
            <Label>Assign Faculty (Optional)</Label>
            <Select 
              value={facultyId?.toString() || "none"} 
              onValueChange={(value) => setFacultyId(value === "none" ? undefined : parseInt(value))}
              disabled={loadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Loading..." : "Select faculty"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    No faculty assigned
                  </div>
                </SelectItem>
                {faculty.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                        {member.name.charAt(0)}
                      </div>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFaculty && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                  {selectedFaculty.name.charAt(0)}
                </div>
                {selectedFaculty.name} - {selectedFaculty.email}
              </div>
            )}
          </div>

          {/* Summary */}
          {courseName && semesterId && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Ready to Create
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {courseType === CourseType.LAB ? (
                    <FlaskConical className="h-3 w-3" />
                  ) : (
                    <BookMarked className="h-3 w-3" />
                  )}
                  {courseName}
                  {courseCode && (
                    <Badge variant="outline" className="text-xs">
                      {courseCode}
                    </Badge>
                  )}
                </div>
                {selectedSemester && (
                  <div className="mt-1 text-xs">
                    {selectedSemester.program.name} - {getSemesterOrdinal(selectedSemester.number)} Semester
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !courseName.trim() || !semesterId || loadingData}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}