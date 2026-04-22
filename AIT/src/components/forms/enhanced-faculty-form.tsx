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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building, 
  Briefcase,
  UserCheck,
  BookOpen,
  Calendar,
  Award,
  MapPin,
  Globe,
  Edit,
  Plus,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

const facultySchema = z.object({
  name: z.string().min(1, "Faculty name is required").max(100, "Faculty name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().max(20, "Phone number too long").optional().or(z.literal("")),
  designation: z.string().max(100, "Designation too long").optional().or(z.literal("")),
  employmentType: z.enum(["PERMANENT", "CONTRACT"], {
    required_error: "Employment type is required",
  }),
  departmentId: z.number().int().positive().optional(),
  // Additional fields for enhanced profile
  officeLocation: z.string().max(100, "Office location too long").optional().or(z.literal("")),
  specialization: z.string().max(200, "Specialization too long").optional().or(z.literal("")),
  qualifications: z.string().max(500, "Qualifications too long").optional().or(z.literal("")),
  experience: z.number().min(0).max(50).optional(),
  researchInterests: z.string().max(500, "Research interests too long").optional().or(z.literal("")),
})

type FacultyFormData = z.infer<typeof facultySchema>

interface Department {
  id: number
  name: string
  code?: string
}

interface Faculty {
  id: number
  name: string
  email: string
  phone?: string
  designation?: string
  employmentType?: string
  department?: Department
  departmentId?: number
}

interface EnhancedFacultyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  faculty?: Faculty
  onSuccess: () => void
}

const designations = [
  "Professor",
  "Associate Professor", 
  "Assistant Professor",
  "Lecturer",
  "Senior Lecturer",
  "Visiting Professor",
  "Adjunct Professor",
  "Research Associate",
  "Teaching Assistant",
  "Lab Instructor"
]

const specializations = [
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Machine Learning",
  "Cybersecurity",
  "Database Systems",
  "Web Development",
  "Mobile Development",
  "Network Administration",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Business Administration",
  "Management",
  "Marketing",
  "Finance",
  "Economics",
  "English Literature",
  "Psychology",
  "Sociology"
]

export function EnhancedFacultyForm({ 
  open, 
  onOpenChange, 
  faculty, 
  onSuccess 
}: EnhancedFacultyFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [activeTab, setActiveTab] = useState<"basic" | "professional" | "academic">("basic")
  
  const isEditing = !!faculty

  const form = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: faculty?.name || "",
      email: faculty?.email || "",
      phone: faculty?.phone || "",
      designation: faculty?.designation || "",
      employmentType: (faculty?.employmentType as "PERMANENT" | "CONTRACT") || "PERMANENT",
      departmentId: faculty?.departmentId || undefined,
      officeLocation: "",
      specialization: "",
      qualifications: "",
      experience: undefined,
      researchInterests: "",
    },
  })

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const result = await response.json()
      
      if (result.success) {
        setDepartments(result.data)
      }
    } catch (error) {
      toast.error('Failed to fetch departments')
    } finally {
      setLoadingDepartments(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchDepartments()
    }
  }, [open])

  useEffect(() => {
    if (faculty) {
      form.reset({
        name: faculty.name,
        email: faculty.email,
        phone: faculty.phone || "",
        designation: faculty.designation || "",
        employmentType: (faculty.employmentType as "PERMANENT" | "CONTRACT") || "PERMANENT",
        departmentId: faculty.departmentId || undefined,
        officeLocation: "",
        specialization: "",
        qualifications: "",
        experience: undefined,
        researchInterests: "",
      })
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        designation: "",
        employmentType: "PERMANENT",
        departmentId: undefined,
        officeLocation: "",
        specialization: "",
        qualifications: "",
        experience: undefined,
        researchInterests: "",
      })
    }
  }, [faculty, form])

  const onSubmit = async (data: FacultyFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/faculty/${faculty.id}` : '/api/faculty'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Clean up data - remove empty strings and undefined values
      const cleanData = {
        ...data,
        phone: data.phone?.trim() || null,
        designation: data.designation?.trim() || null,
        departmentId: data.departmentId || null,
        officeLocation: data.officeLocation?.trim() || null,
        specialization: data.specialization?.trim() || null,
        qualifications: data.qualifications?.trim() || null,
        researchInterests: data.researchInterests?.trim() || null,
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

      toast.success(result.message || `Faculty member ${isEditing ? 'updated' : 'created'} successfully`)
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDepartment = departments.find(d => d.id === form.watch("departmentId"))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Faculty Member
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Faculty Member
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the faculty member information below.' 
              : 'Add a new faculty member with comprehensive profile information.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-2">
              <User className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="professional" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Professional
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Academic
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Dr. Sarah Johnson" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="e.g., sarah.johnson@university.edu" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone and Employment Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              placeholder="e.g., +1 (555) 123-4567" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Optional contact number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Employment Type *
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PERMANENT">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  Permanent
                                </div>
                              </SelectItem>
                              <SelectItem value="CONTRACT">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Contract Basis
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Office Location */}
                  <FormField
                    control={form.control}
                    name="officeLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Office Location
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Room 205, Computer Science Building" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Physical office location or room number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="professional" className="space-y-4 mt-0">
                  {/* Designation and Department */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Designation
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {designations.map((designation) => (
                                <SelectItem key={designation} value={designation}>
                                  {designation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Academic or professional title
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Department
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                            value={field.value?.toString() || "none"}
                            disabled={loadingDepartments}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select department"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No department assigned</SelectItem>
                              {departments.map((department) => (
                                <SelectItem key={department.id} value={department.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    {department.name}
                                    {department.code && (
                                      <Badge variant="outline" className="text-xs">
                                        {department.code}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedDepartment && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                              <p className="text-sm">
                                <span className="font-medium">Selected:</span> {selectedDepartment.name}
                                {selectedDepartment.code && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {selectedDepartment.code}
                                  </Badge>
                                )}
                              </p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Experience and Specialization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Years of Experience
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              max="50"
                              placeholder="e.g., 5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total years of teaching/professional experience
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Specialization
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialization" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {specializations.map((spec) => (
                                <SelectItem key={spec} value={spec}>
                                  {spec}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Primary area of expertise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4 mt-0">
                  {/* Qualifications */}
                  <FormField
                    control={form.control}
                    name="qualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Qualifications
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Ph.D. in Computer Science, M.S. in Software Engineering, B.S. in Computer Science"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Educational background and degrees
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Research Interests */}
                  <FormField
                    control={form.control}
                    name="researchInterests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Research Interests
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Machine Learning, Artificial Intelligence, Data Mining, Natural Language Processing"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Areas of research and academic interest
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
            disabled={isLoading || loadingDepartments}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isEditing ? 'Update Faculty' : 'Add Faculty'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}