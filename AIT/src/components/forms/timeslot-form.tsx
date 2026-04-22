"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const timeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM format"),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM format"),
}).refine((data) => {
  const startTime = new Date(`1970-01-01T${data.start}:00`)
  const endTime = new Date(`1970-01-01T${data.end}:00`)
  return endTime > startTime
}, {
  message: "End time must be after start time",
  path: ["end"]
})

type TimeSlotFormData = z.infer<typeof timeSlotSchema>

interface TimeSlot {
  id: number
  start: string
  end: string
}

interface TimeSlotFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeSlot?: TimeSlot
  onSuccess: () => void
}

export function TimeSlotForm({ open, onOpenChange, timeSlot, onSuccess }: TimeSlotFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!timeSlot

  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      start: timeSlot?.start || "",
      end: timeSlot?.end || "",
    },
  })

  const onSubmit = async (data: TimeSlotFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/timeslots/${timeSlot.id}` : '/api/timeslots'
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

      toast.success(result.message || `Time slot ${isEditing ? 'updated' : 'created'} successfully`)
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const calculateDuration = () => {
    const start = form.watch('start')
    const end = form.watch('end')
    
    if (!start || !end) return ""
    
    try {
      const startTime = new Date(`1970-01-01T${start}:00`)
      const endTime = new Date(`1970-01-01T${end}:00`)
      const diffMs = endTime.getTime() - startTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      if (diffHours <= 0) return ""
      
      const hours = Math.floor(diffHours)
      const minutes = Math.round((diffHours - hours) * 60)
      
      if (hours === 0) return `${minutes} minutes`
      if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`
    } catch {
      return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Time Slot' : 'Add Time Slot'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the time slot information below.' 
              : 'Add a new time slot for course scheduling.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="text-xs text-gray-500">
                        {formatTime(field.value)}
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="text-xs text-gray-500">
                        {formatTime(field.value)}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
            
            {calculateDuration() && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="text-sm font-medium text-blue-900">Duration</div>
                <div className="text-sm text-blue-700">{calculateDuration()}</div>
              </div>
            )}
            
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