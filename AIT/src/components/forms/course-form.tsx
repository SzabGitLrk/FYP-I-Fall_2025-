"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CourseType } from "@/lib/types"

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200, "Course name too long"),
  code: z.string().max(20, "Course code too long").optional().or(z.literal("")),
  type: z.nativeEnum(CourseType, { message: "Course type is required" }),
  semesterId: z.number().int().positive("Semester is required"),
  facultyId: z.number().int().positive().optional(),
})

type CourseFormData = z.infer<typeof courseSchema>

interface Program {
  id: number
  name: string
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

interface Course {
  id: number
  name: string
  code: string | null
  type: CourseType
  createdAt: string
  semester: {
    id: number
    number: number
    program: {
      id: number
      name: string
    }
  }
  faculty?: Faculty
  timetable: Array<{ id: number }>
}

interface CourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course
  onSuccess: () => void
}

export function CourseForm({ open, onOpenChange, course, onSuccess }: CourseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const isEditing = !!course

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || "",
      code: course?.code || "",
      type: course?.type || CourseType.THEORY,
      semesterId: course?.semester?.id || 0,
      facultyId: course?.faculty?.id || undefined,
    },
  })

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
    }
  }, [open])

  useEffect(() => {
    if (course) {
      form.reset({
        name: course.name,
        code: course.code || "",
        type: course.type,
        semesterId: course.semester?.id || 0,
        facultyId: course.faculty?.id || undefined,
      })
    } else {
      form.reset({
        name: "",
        code: "",
        type: CourseType.THEORY,
        semesterId: 0,
        facultyId: undefined,
      })
    }
  }, [course, form])

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/courses/${course.id}` : '/api/courses'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Something went wrong')
      }

      toast.success(result.message || `Course ${isEditing ? 'updated' : 'created'} successfully`)
      form.reset()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Course' : 'Create Course'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the course information below.' 
              : 'Add a new course to a semester.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Data Structures" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., CS201 (optional)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CourseType.THEORY}>Theory</SelectItem>
                      <SelectItem value={CourseType.LAB}>Lab</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="semesterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading semesters..." : "Select a semester"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allSemesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id.toString()}>
                          {semester.program.name} - {getSemesterOrdinal(semester.number)} Semester
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="facultyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                    value={field.value?.toString() || "none"}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading faculty..." : "Select faculty (optional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No faculty assigned</SelectItem>
                      {faculty.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || loadingData}>
                {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}