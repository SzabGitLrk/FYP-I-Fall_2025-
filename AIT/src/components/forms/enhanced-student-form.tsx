"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Building,
  Save,
  X,
  Sparkles,
  UserCheck,
  BookOpen,
  Hash
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

const studentSchema = z.object({
  regId: z.string().min(1, "Registration ID is required").max(50, "Registration ID too long"),
  regName: z.string().min(1, "Full name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  programId: z.number().int().positive().optional().or(z.literal("")),
  semesterId: z.number().int().positive().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
})

type StudentFormData = z.infer<typeof studentSchema>

interface Student {
  id: number
  regId: string
  regName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  programId?: number
  semesterId?: number
  isActive: boolean
  program?: {
    id: number
    name: string
    code?: string
    department: {
      id: number
      name: string
    }
  }
  semester?: {
    id: number
    number: number
  }
  enrollments?: Array<{
    id: number
    course: {
      id: number
      name: string
      code?: string
    }
  }>
}

interface Program {
  id: number
  name: string
  code?: string
  department: {
    id: number
    name: string
  }
  semesters: {
    id: number
    number: number
  }[]
}

interface EnhancedStudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
  onSuccess: () => void
}

export function EnhancedStudentForm({ open, onOpenChange, student, onSuccess }: EnhancedStudentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [semesters, setSemesters] = useState<{ id: number; number: number }[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const isEditing = !!student

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      regId: student?.regId || "",
      regName: student?.regName || "",
      email: student?.email || "",
      phone: student?.phone || "",
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
      address: student?.address || "",
      programId: student?.programId || "",
      semesterId: student?.semesterId || "",
      isActive: student?.isActive ?? true,
    },
  })

  const selectedProgramId = form.watch("programId")
  const regId = form.watch("regId")

  // Auto-generate email from registration ID
  useEffect(() => {
    if (regId && !isEditing) {
      const cleanRegId = regId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      if (cleanRegId) {
        const generatedEmail = `${cleanRegId}@university.edu.pk`
        const currentEmail = form.getValues("email")
        if (!currentEmail) {
          form.setValue("email", generatedEmail)
        }
      }
    }
  }, [regId, form, isEditing])

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs')
        const result = await response.json()
        if (result.success) {
          setPrograms(result.data)
        }
      } catch (error) {
        console.error('Error fetching programs:', error)
      }
    }

    if (open) {
      fetchPrograms()
    }
  }, [open])

  // Update semesters when program changes
  useEffect(() => {
    if (selectedProgramId) {
      const program = programs.find(p => p.id === selectedProgramId)
      if (program) {
        setSemesters(program.semesters)
        const currentSemesterId = form.getValues("semesterId")
        if (currentSemesterId && !program.semesters.find(s => s.id === currentSemesterId)) {
          form.setValue("semesterId", "")
        }
      }
    } else {
      setSemesters([])
      form.setValue("semesterId", "")
    }
  }, [selectedProgramId, programs, form])

  const onSubmit = async (data: StudentFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/students/${student.id}` : '/api/students'
      const method = isEditing ? 'PUT' : 'POST'
      
      const submitData = {
        ...data,
        programId: data.programId || undefined,
        semesterId: data.semesterId || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        address: data.address || undefined,
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Something went wrong')
      }

      toast.success(result.message || `Student ${isEditing ? 'updated' : 'created'} successfully`)
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setActiveTab("basic")
    onOpenChange(false)
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {isEditing ? 'Edit Student' : 'Add New Student'}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {isEditing 
                  ? 'Update student information and academic details.' 
                  : 'Create a comprehensive student profile with academic information.'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-6"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic" className="gap-2">
                      <User className="h-4 w-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Academic
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      Contact & Personal
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Hash className="h-5 w-5 text-blue-500" />
                          Student Identification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="regId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Hash className="h-4 w-4" />
                                  Registration ID *
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., 2024-CS-001" 
                                    {...field} 
                                    className="font-mono"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Unique student registration identifier
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="regName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Full Name *
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Ahmed Hassan Khan" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Student's complete legal name
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  Active Status
                                </FormLabel>
                                <FormDescription>
                                  Enable or disable this student account
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="academic" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-emerald-500" />
                          Academic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="programId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Program
                                </FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "none" ? "" : parseInt(value))}
                                  value={field.value ? field.value.toString() : "none"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select academic program" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Program Selected</SelectItem>
                                    {programs.map((program) => (
                                      <SelectItem key={program.id} value={program.id.toString()}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {program.code || program.name}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {program.department.name}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Student's enrolled academic program
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="semesterId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Current Semester
                                </FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "none" ? "" : parseInt(value))}
                                  value={field.value ? field.value.toString() : "none"}
                                  disabled={!selectedProgramId}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Semester Selected</SelectItem>
                                    {semesters.map((semester) => (
                                      <SelectItem key={semester.id} value={semester.id.toString()}>
                                        Semester {semester.number}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {selectedProgramId 
                                    ? "Current semester in the selected program"
                                    : "Select a program first to choose semester"
                                  }
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {selectedProgram && (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Program Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Program:</span>
                                <p className="font-medium">{selectedProgram.name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Department:</span>
                                <p className="font-medium">{selectedProgram.department.name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Available Semesters:</span>
                                <div className="flex gap-1 mt-1">
                                  {selectedProgram.semesters.map((sem) => (
                                    <Badge key={sem.id} variant="outline" className="text-xs">
                                      Sem {sem.number}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mail className="h-5 w-5 text-purple-500" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Email Address
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email"
                                    placeholder="e.g., student@university.edu.pk" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Primary email for communication
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  Phone Number
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., +92 300 1234567" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Contact number for emergencies
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-orange-500" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date of Birth
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Student's date of birth
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Address
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="e.g., House 123, Street 45, City, Province"
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Complete residential address
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </motion.div>
        </ScrollArea>

        <DialogFooter className="shrink-0 p-6 pt-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? 'Update Student' : 'Create Student'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}