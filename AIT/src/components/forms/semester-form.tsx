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
import { toast } from "sonner"
import { 
  GraduationCap, 
  Layers, 
  Calendar,
  Sparkles,
  Plus,
  Edit,
  BookOpen
} from "lucide-react"

const semesterSchema = z.object({
  number: z.number().int().min(1, "Semester number must be at least 1").max(8, "Semester number cannot exceed 8"),
  programId: z.number().int().positive("Program is required"),
})

type SemesterFormData = z.infer<typeof semesterSchema>

interface Program {
  id: number
  name: string
  code?: string
}

interface Semester {
  id: number
  number: number
  programId: number
  program: Program
}

interface SemesterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semester?: Semester
  onSuccess: () => void
}

export function SemesterForm({ open, onOpenChange, semester, onSuccess }: SemesterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const isEditing = !!semester

  const form = useForm<SemesterFormData>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      number: semester?.number || 1,
      programId: semester?.programId || 0,
    },
  })

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (result.success) {
        setPrograms(result.data)
      } else {
        toast.error('Failed to fetch programs')
      }
    } catch (error) {
      toast.error('Failed to fetch programs')
    } finally {
      setLoadingPrograms(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPrograms()
    }
  }, [open])

  useEffect(() => {
    if (semester) {
      form.reset({
        number: semester.number,
        programId: semester.programId,
      })
    } else {
      form.reset({
        number: 1,
        programId: 0,
      })
    }
  }, [semester, form])

  const onSubmit = async (data: SemesterFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/semesters/${semester.id}` : '/api/semesters'
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

      toast.success(result.message || `Semester ${isEditing ? 'updated' : 'created'} successfully`)
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const semesterOptions = Array.from({ length: 8 }, (_, i) => i + 1)
  
  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const selectedProgram = programs.find(p => p.id === form.watch('programId'))
  const selectedSemesterNumber = form.watch('number')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              {isEditing ? (
                <Edit className="h-6 w-6 text-white" />
              ) : (
                <Sparkles className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {isEditing ? 'Edit Semester' : 'Create New Semester'}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {isEditing 
                  ? 'Update the semester information below' 
                  : 'Add a new semester to a program'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Program Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <GraduationCap className="h-4 w-4" />
                Program Assignment
              </div>
              
              <FormField
                control={form.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-violet-600" />
                      Program *
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                      disabled={loadingPrograms || isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={loadingPrograms ? "Loading programs..." : "Select a program"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.code ? `${program.code} - ${program.name}` : program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isEditing 
                        ? 'Program cannot be changed when editing' 
                        : 'Select the program this semester belongs to'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Semester Number */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Layers className="h-4 w-4" />
                Semester Details
              </div>
              
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Semester Number *
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select semester number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semesterOptions.map((number) => (
                          <SelectItem key={number} value={number.toString()}>
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              {getSemesterOrdinal(number)} Semester
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the semester number (1-8)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preview Card */}
            {selectedProgram && selectedSemesterNumber && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  Preview
                </div>
                
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            {getSemesterOrdinal(selectedSemesterNumber)} Semester
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            Semester {selectedSemesterNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedProgram.code || selectedProgram.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedProgram.name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </form>
        </Form>

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
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading || loadingPrograms}
            className="h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
                    Update Semester
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Semester
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
