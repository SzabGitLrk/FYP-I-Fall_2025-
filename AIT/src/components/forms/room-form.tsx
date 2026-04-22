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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { RoomType } from "@/lib/types"

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100, "Room name too long"),
  type: z.nativeEnum(RoomType, { message: "Room type is required" }),
  minCapacity: z.number().int().min(1, "Minimum capacity must be at least 1").optional().or(z.literal("")),
  maxCapacity: z.number().int().min(1, "Maximum capacity must be at least 1").optional().or(z.literal("")),
}).refine((data) => {
  const min = typeof data.minCapacity === 'number' ? data.minCapacity : undefined
  const max = typeof data.maxCapacity === 'number' ? data.maxCapacity : undefined
  
  if (min && max) {
    return min <= max
  }
  return true
}, {
  message: "Minimum capacity cannot be greater than maximum capacity",
  path: ["maxCapacity"]
})

type RoomFormData = z.infer<typeof roomSchema>

interface Room {
  id: number
  name: string
  type: RoomType
  minCapacity?: number
  maxCapacity?: number
}

interface RoomFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room
  onSuccess: () => void
}

export function RoomForm({ open, onOpenChange, room, onSuccess }: RoomFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!room

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name || "",
      type: room?.type || RoomType.CLASSROOM,
      minCapacity: room?.minCapacity || "",
      maxCapacity: room?.maxCapacity || "",
    },
  })

  const onSubmit = async (data: RoomFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/rooms/${room.id}` : '/api/rooms'
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

      toast.success(result.message || `Room ${isEditing ? 'updated' : 'created'} successfully`)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Room' : 'Add Room'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the room information below.' 
              : 'Add a new room to the system.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Room 101, Lab A, Computer Lab 1" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RoomType.CLASSROOM}>Classroom</SelectItem>
                      <SelectItem value={RoomType.LAB}>Laboratory</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Capacity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 20"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? '' : parseInt(value))
                        }}
                        value={field.value === '' ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 50"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? '' : parseInt(value))
                        }}
                        value={field.value === '' ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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