"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CourseType } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Code, 
  Layers,
  User,
  Sparkles,
  Save,
  ListPlus,
  HelpCircle
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200, "Course name too long"),
  code: z.string().max(20, "Course code too long").optional().or(z.literal("")),
  type: z.nativeEnum(CourseType, { message: "Course type is required" }),
  facultyId: z.number().int().positive().optional(),
})

type CourseFormData = z.infer<typeof courseSchema>

interface Faculty {
  id: number
  name: string
  email: string
}

interface Semester {
  id: number
  number: number
  program: {
    id: number
    name: string
    code?: string
  }
}

interface MultiCourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semester: Semester
  onSuccess: () => void
}

export function MultiCourseForm({ open, onOpenChange, semester, onSuccess }: MultiCourseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [coursesToAdd, setCoursesToAdd] = useState<CourseFormData[]>([])
  const [savingProgress, setSavingProgress] = useState(0)

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      code: "",
      type: CourseType.THEORY,
      facultyId: undefined,
    },
  })

  const fetchData = async () => {
    try {
      const facultyResponse = await fetch('/api/faculty')
      const facultyResult = await facultyResponse.json()
      
      if (facultyResult.success) {
        setFaculty(facultyResult.data)
      }
    } catch (error) {
      toast.error('Failed to fetch faculty data')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchData()
      setCoursesToAdd([])
      form.reset()
      setSavingProgress(0)
    }
  }, [open])

  const onSubmit = async (data: CourseFormData) => {
    // Add course to the list
    setCoursesToAdd([...coursesToAdd, data])
    form.reset({
      name: "",
      code: "",
      type: CourseType.THEORY,
      facultyId: undefined,
    })
    toast.success("Course added to queue")
  }

  const removeCourse = (index: number) => {
    setCoursesToAdd(coursesToAdd.filter((_, i) => i !== index))
  }

  const handleFinish = async () => {
    if (coursesToAdd.length === 0) {
      toast.error("Please add at least one course")
      return
    }

    setIsLoading(true)
    try {
      let successCount = 0
      const total = coursesToAdd.length

      for (let i = 0; i < coursesToAdd.length; i++) {
        const courseData = coursesToAdd[i]
        
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...courseData,
            semesterId: semester.id,
          }),
        })

        const result = await response.json()

        if (result.success) {
          successCount++
        } else {
          toast.error(`Failed to create "${courseData.name}": ${result.error}`)
        }

        // Update progress
        setSavingProgress(Math.round(((i + 1) / total) * 100))
      }

      if (successCount === total) {
        toast.success(`All ${total} courses added successfully`)
        setCoursesToAdd([])
        form.reset()
        onOpenChange(false)
        onSuccess()
      } else if (successCount > 0) {
        toast.warning(`${successCount} of ${total} courses added successfully`)
        setCoursesToAdd([])
        form.reset()
        onOpenChange(false)
        onSuccess()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
      setSavingProgress(0)
    }
  }

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <ListPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Add Multiple Courses</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Add multiple courses to {semester.program.code || semester.program.name} - {getSemesterOrdinal(semester.number)} Semester
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Course Input Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Plus className="h-4 w-4" />
              Add New Course
            </div>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200">
              <CardContent className="p-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-emerald-600" />
                              Course Name *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Data Structures" 
                                className="h-11 bg-white dark:bg-slate-900"
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
                            <FormLabel className="flex items-center gap-2">
                              <Code className="h-4 w-4 text-purple-600" />
                              Course Code
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., CS201" 
                                className="h-11 bg-white dark:bg-slate-900"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-blue-600" />
                              Course Type *
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 bg-white dark:bg-slate-900">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={CourseType.THEORY}>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Theory
                                  </div>
                                </SelectItem>
                                <SelectItem value={CourseType.LAB}>
                                  <div className="flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    Lab
                                  </div>
                                </SelectItem>
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
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4 text-orange-600" />
                              Faculty (Optional)
                            </FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                              value={field.value?.toString() || "none"}
                              disabled={loadingData}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 bg-white dark:bg-slate-900">
                                  <SelectValue placeholder={loadingData ? "Loading..." : "Select faculty"} />
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
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || loadingData}
                      className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Queue
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Courses Queue */}
          {coursesToAdd.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <CheckCircle2 className="h-4 w-4" />
                  Courses Queue
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {coursesToAdd.length} {coursesToAdd.length === 1 ? 'course' : 'courses'}
                </Badge>
              </div>
              
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200">
                <CardContent className="p-4">
                  <AnimatePresence>
                    <div className="space-y-2">
                      {coursesToAdd.map((course, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{course.name}</span>
                              {course.code && (
                                <Badge variant="secondary" className="text-xs">
                                  <Code className="h-3 w-3 mr-1" />
                                  {course.code}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  course.type === CourseType.THEORY 
                                    ? 'border-blue-300 text-blue-700 dark:text-blue-400' 
                                    : 'border-purple-300 text-purple-700 dark:text-purple-400'
                                }`}
                              >
                                {course.type === CourseType.THEORY ? (
                                  <BookOpen className="h-3 w-3 mr-1" />
                                ) : (
                                  <Code className="h-3 w-3 mr-1" />
                                )}
                                {course.type}
                              </Badge>
                            </div>
                            {course.facultyId && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {faculty.find(f => f.id === course.facultyId)?.name}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(index)}
                            disabled={isLoading}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Saving Progress */}
          {isLoading && savingProgress > 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Saving courses...
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <motion.div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${savingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{savingProgress}% complete</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleFinish} 
            disabled={isLoading || coursesToAdd.length === 0 || loadingData}
            className="h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving... ({savingProgress}%)
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Finish & Save ({coursesToAdd.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
