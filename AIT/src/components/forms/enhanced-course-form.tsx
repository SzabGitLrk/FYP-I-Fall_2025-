"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BookMarked, 
  FlaskConical, 
  User, 
  GraduationCap, 
  Copy, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
  Code,
  Users,
  Clock,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { CourseType } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200, "Course name too long"),
  code: z.string().max(20, "Course code too long").optional().or(z.literal("")),
  type: z.nativeEnum(CourseType, { message: "Course type is required" }),
  semesterId: z.number().int().positive("Semester is required"),
  facultyId: z.number().int().positive().optional(),
  description: z.string().max(500, "Description too long").optional().or(z.literal("")),
  credits: z.number().min(1).max(10).optional(),
  maxEnrollment: z.number().min(1).max(200).optional(),
  prerequisites: z.string().optional().or(z.literal("")),
})

type CourseFormData = z.infer<typeof courseSchema>

interface Program {
  id: number
  name: string
  code?: string
  department: {
    id: number
    name: string
    code?: string
  }
  semesters: Array<{
    id: number
    number: number
  }>
}

interface Faculty {
  id: number
  name: string
  email: string
  designation?: string
  department?: {
    id: number
    name: string
  }
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

interface CourseTemplate {
  id: string
  name: string
  type: CourseType
  credits?: number
  maxEnrollment?: number
  description?: string
  icon: React.ReactNode
  color: string
}

interface EnhancedCourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course
  onSuccess: () => void
  defaultSemesterId?: number
  duplicateFrom?: Course
}

const courseTemplates: CourseTemplate[] = [
  {
    id: "programming",
    name: "Programming Course",
    type: CourseType.THEORY,
    credits: 3,
    maxEnrollment: 40,
    description: "Programming fundamentals and software development",
    icon: <Code className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "lab",
    name: "Laboratory Course",
    type: CourseType.LAB,
    credits: 1,
    maxEnrollment: 20,
    description: "Hands-on practical laboratory sessions",
    icon: <FlaskConical className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "theory",
    name: "Theory Course",
    type: CourseType.THEORY,
    credits: 3,
    maxEnrollment: 60,
    description: "Theoretical concepts and principles",
    icon: <BookMarked className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "seminar",
    name: "Seminar Course",
    type: CourseType.THEORY,
    credits: 2,
    maxEnrollment: 30,
    description: "Discussion-based seminar sessions",
    icon: <Users className="h-5 w-5" />,
    color: "from-orange-500 to-red-500"
  }
]

export function EnhancedCourseForm({ 
  open, 
  onOpenChange, 
  course, 
  onSuccess, 
  defaultSemesterId,
  duplicateFrom 
}: EnhancedCourseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"basic" | "advanced" | "template">("basic")
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const isEditing = !!course
  const isDuplicating = !!duplicateFrom

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      code: "",
      type: CourseType.THEORY,
      semesterId: defaultSemesterId || 0,
      facultyId: undefined,
      description: "",
      credits: 3,
      maxEnrollment: 40,
      prerequisites: "",
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
      setSelectedTemplate(null)
      setActiveTab("basic")
      setShowAdvanced(false)
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
        description: "",
        credits: 3,
        maxEnrollment: 40,
        prerequisites: "",
      })
    } else if (duplicateFrom) {
      form.reset({
        name: `${duplicateFrom.name} (Copy)`,
        code: "",
        type: duplicateFrom.type,
        semesterId: duplicateFrom.semester?.id || defaultSemesterId || 0,
        facultyId: duplicateFrom.faculty?.id || undefined,
        description: "",
        credits: 3,
        maxEnrollment: 40,
        prerequisites: "",
      })
    } else {
      form.reset({
        name: "",
        code: "",
        type: CourseType.THEORY,
        semesterId: defaultSemesterId || 0,
        facultyId: undefined,
        description: "",
        credits: 3,
        maxEnrollment: 40,
        prerequisites: "",
      })
    }
  }, [course, duplicateFrom, defaultSemesterId, form])

  const applyTemplate = (template: CourseTemplate) => {
    setSelectedTemplate(template.id)
    form.setValue("type", template.type)
    if (template.credits) form.setValue("credits", template.credits)
    if (template.maxEnrollment) form.setValue("maxEnrollment", template.maxEnrollment)
    if (template.description) form.setValue("description", template.description)
    
    // Auto-generate course name if empty
    if (!form.getValues("name")) {
      const selectedSemester = allSemesters.find(s => s.id === form.getValues("semesterId"))
      if (selectedSemester) {
        const suggestedName = `${selectedSemester.program.name} ${template.name}`
        form.setValue("name", suggestedName)
      }
    }
    
    toast.success(`Applied ${template.name} template`)
  }

  const onSubmit = async (data: CourseFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/courses/${course.id}` : '/api/courses'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Clean up data - remove empty strings and undefined values
      const cleanData = {
        ...data,
        code: data.code?.trim() || null,
        description: data.description?.trim() || null,
        prerequisites: data.prerequisites?.trim() || null,
        facultyId: data.facultyId || null,
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Something went wrong')
      }

      const action = isEditing ? 'updated' : isDuplicating ? 'duplicated' : 'created'
      toast.success(result.message || `Course ${action} successfully`)
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

  // Group semesters by program for better organization
  const semestersByProgram = programs.reduce((acc, program) => {
    acc[program.id] = program.semesters.map(semester => ({
      ...semester,
      program
    }))
    return acc
  }, {} as Record<number, Array<{ id: number; number: number; program: Program }>>)

  const selectedSemester = allSemesters.find(s => s.id === form.watch("semesterId"))
  const selectedFaculty = faculty.find(f => f.id === form.watch("facultyId"))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Course
              </>
            ) : isDuplicating ? (
              <>
                <Copy className="h-5 w-5" />
                Duplicate Course
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Create New Course
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the course information below.' 
              : isDuplicating
              ? 'Create a copy of the selected course with modifications.'
              : 'Add a new course to a semester with enhanced options.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2" disabled={isEditing}>
              <Sparkles className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Layers className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  {/* Course Name and Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Data Structures and Algorithms" 
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
                          <FormLabel>Course Code</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., CS201" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Optional unique identifier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Course Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Type *</FormLabel>
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
                            <SelectItem value={CourseType.THEORY}>
                              <div className="flex items-center gap-2">
                                <BookMarked className="h-4 w-4" />
                                Theory Course
                              </div>
                            </SelectItem>
                            <SelectItem value={CourseType.LAB}>
                              <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4" />
                                Laboratory Course
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Semester Selection */}
                  <FormField
                    control={form.control}
                    name="semesterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester *</FormLabel>
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
                            {Object.entries(semestersByProgram).map(([programId, semesters]) => {
                              const program = programs.find(p => p.id === parseInt(programId))
                              if (!program) return null
                              
                              return (
                                <div key={programId}>
                                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b">
                                    {program.name}
                                    {program.department && (
                                      <span className="text-xs ml-2">({program.department.name})</span>
                                    )}
                                  </div>
                                  {semesters.map((semester) => (
                                    <SelectItem key={semester.id} value={semester.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        {getSemesterOrdinal(semester.number)} Semester
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        {selectedSemester && (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md">
                            <p className="text-sm">
                              <span className="font-medium">Selected:</span> {selectedSemester.program.name} - {getSemesterOrdinal(selectedSemester.number)} Semester
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Faculty Assignment */}
                  <FormField
                    control={form.control}
                    name="facultyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Faculty</FormLabel>
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
                            <SelectItem value="none">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                No faculty assigned
                              </div>
                            </SelectItem>
                            {faculty.map((member) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                                    {member.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-medium">{member.name}</p>
                                    {member.designation && (
                                      <p className="text-xs text-muted-foreground">{member.designation}</p>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedFaculty && (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                                {selectedFaculty.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{selectedFaculty.name}</p>
                                <p className="text-xs text-muted-foreground">{selectedFaculty.email}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="template" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Course Templates</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose a template to quickly set up your course with predefined settings.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courseTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedTemplate === template.id 
                                ? 'ring-2 ring-primary border-primary' 
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => applyTemplate(template)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color}`}>
                                  <div className="text-white">
                                    {template.icon}
                                  </div>
                                </div>
                                {selectedTemplate === template.id && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {template.type}
                                </Badge>
                                {template.credits && (
                                  <Badge variant="outline" className="text-xs">
                                    {template.credits} Credits
                                  </Badge>
                                )}
                                {template.maxEnrollment && (
                                  <Badge variant="outline" className="text-xs">
                                    Max {template.maxEnrollment}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-0">
                  {/* Course Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the course content and objectives..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description for course catalog
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Credits and Enrollment */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="credits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              max="10"
                              placeholder="3"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Academic credit value
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxEnrollment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Enrollment</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              max="200"
                              placeholder="40"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum students allowed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Prerequisites */}
                  <FormField
                    control={form.control}
                    name="prerequisites"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prerequisites</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., CS101, Math201"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Required courses (comma-separated)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </form>
            </Form>
          </ScrollArea>
        </Tabs>

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
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading || loadingData}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Update Course
                  </>
                ) : isDuplicating ? (
                  <>
                    <Copy className="h-4 w-4" />
                    Duplicate Course
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create Course
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}