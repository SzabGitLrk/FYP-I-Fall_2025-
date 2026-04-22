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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const studentSchema = z.object({
  regId: z.string().min(1, "Registration ID is required").max(50, "Registration ID too long"),
  regName: z.string().min(1, "Registration Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
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
    department: {
      id: number
      name: string
    }
  }
  semester?: {
    id: number
    number: number
  }
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

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
  onSuccess: () => void
}

export function StudentForm({ open, onOpenChange, student, onSuccess }: StudentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [semesters, setSemesters] = useState<{ id: number; number: number }[]>([])
  const isEditing = !!student

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      regId: student?.regId || "",
      regName: student?.regName || "",
      email: student?.email || "",
      phone: student?.phone || "",
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
      // Extract just the numeric/alphanumeric part from regId (remove dashes, spaces, etc.)
      const cleanRegId = regId.replace(/[^a-zA-Z0-9]/g, '')
      if (cleanRegId) {
        const generatedEmail = `${cleanRegId}@university.edu.pk`
        // Only set if email field is empty
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
        // Reset semester selection if current semester doesn't belong to selected program
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
      
      // Prepare data
      const submitData = {
        ...data,
        programId: data.programId || undefined,
        semesterId: data.semesterId || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add Student'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the student information below.' 
              : 'Add a new student to the system.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="regId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration ID *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2024-CS-001" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="regName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Waqar Ahmed" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="e.g., john.doe@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., +92 123 456789" 
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
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? "" : parseInt(value))}
                      value={field.value ? field.value.toString() : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Program</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.code || program.name}
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
                name="semesterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
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
                        <SelectItem value="none">No Semester</SelectItem>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={semester.id.toString()}>
                            Semester {semester.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this student account
                    </div>
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
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}