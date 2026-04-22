"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { 
  GraduationCap, 
  Building2, 
  Clock, 
  Sparkles, 
  Plus,
  Edit,
  Layers,
  BookOpen
} from "lucide-react"

const programSchema = z.object({
  name: z.string().min(1, "Program name is required").max(100, "Program name too long"),
  code: z.string().min(1, "Program code is required").max(20, "Program code too long"),
  description: z.string().optional(),
  duration: z.number().min(0.5, "Duration must be at least 0.5 years").max(10, "Duration cannot exceed 10 years"),
  departmentId: z.number().min(1, "Department is required"),
})

type ProgramFormData = z.infer<typeof programSchema>

interface Department {
  id: number
  name: string
  code?: string
}

interface Program {
  id: number
  name: string
  code?: string
  description?: string
  duration?: number
  departmentId: number
  department?: Department
}

interface ProgramFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  program?: Program
  onSuccess: () => void
}

export function ProgramForm({ open, onOpenChange, program, onSuccess }: ProgramFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const isEditing = !!program

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      duration: 4,
      departmentId: 0,
    },
  })

  // Watch duration to calculate semesters
  const duration = form.watch("duration")
  const numberOfSemesters = Math.ceil(duration * 2)

  // Reset form when program changes or dialog opens
  useEffect(() => {
    if (open) {
      if (program) {
        form.reset({
          name: program.name || "",
          code: program.code || "",
          description: program.description || "",
          duration: program.duration || 4,
          departmentId: program.departmentId || 0,
        })
      } else {
        form.reset({
          name: "",
          code: "",
          description: "",
          duration: 4,
          departmentId: 0,
        })
      }
      fetchDepartments()
    }
  }, [open, program])

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true)
      const response = await fetch('/api/departments')
      const result = await response.json()
      
      if (result.success) {
        setDepartments(result.data)
      } else {
        toast.error('Failed to fetch departments')
      }
    } catch (error) {
      toast.error('Failed to fetch departments')
    } finally {
      setLoadingDepartments(false)
    }
  }

  const onSubmit = async (data: ProgramFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/programs/${program.id}` : '/api/programs'
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

      toast.success(result.message || `Program ${isEditing ? 'updated' : 'created'} successfully`)
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
              {isEditing ? (
                <Edit className="h-6 w-6 text-white" />
              ) : (
                <Sparkles className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {isEditing ? 'Edit Program' : 'Create New Program'}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {isEditing 
                  ? 'Update the program information below' 
                  : 'Add a new academic program with automatic semester generation'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Department Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Building2 className="h-4 w-4" />
                Department Assignment
              </div>
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Department *
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                      disabled={loadingDepartments}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select a department"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.code ? `${dept.code} - ${dept.name}` : dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the department this program belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Information */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <GraduationCap className="h-4 w-4" />
                Program Information
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-violet-600" />
                        Program Name *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Bachelor of Science in Computer Science" 
                          className="h-11"
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
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        Program Code *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., BSCS, BSSE, BBA" 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Short code to identify the program
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        Duration (Years) *
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 1.5, 2, 2.5, 3, 4].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant={field.value === val ? "default" : "outline"}
                              size="sm"
                              onClick={() => field.onChange(val)}
                              className={field.value === val ? "bg-gradient-to-r from-violet-600 to-purple-600" : ""}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a detailed description of the program..."
                        rows={3}
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Semester Preview */}
            {duration > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Layers className="h-4 w-4" />
                  Semester Structure
                </div>
                <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                          Semesters to be {isEditing ? 'adjusted to' : 'created'}: {numberOfSemesters}
                        </p>
                        <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                          {duration} {duration === 1 ? 'year' : 'years'} × 2 semesters/year = {numberOfSemesters} semesters
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {numberOfSemesters}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: numberOfSemesters }, (_, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 px-3 py-1.5 text-sm font-medium text-white shadow-md"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          Semester {i + 1}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={isLoading}
                className="h-11"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || loadingDepartments}
                className="h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Update Program
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Program
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
