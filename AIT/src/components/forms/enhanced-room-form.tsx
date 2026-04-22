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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MapPin, 
  Users, 
  Monitor, 
  Wifi, 
  Volume2, 
  Lightbulb, 
  Accessibility,
  Building,
  Layers,
  Save,
  X,
  Sparkles,
  School,
  FlaskConical,
  Settings,
  Info
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { RoomType } from "@/lib/types"

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100, "Room name too long"),
  type: z.nativeEnum(RoomType, { message: "Room type is required" }),
  minCapacity: z.number().int().min(1, "Minimum capacity must be at least 1").optional().or(z.literal("")),
  maxCapacity: z.number().int().min(1, "Maximum capacity must be at least 1").optional().or(z.literal("")),
  // Enhancement fields
  building: z.string().optional().or(z.literal("")),
  floor: z.string().optional().or(z.literal("")),
  equipment: z.array(z.string()).optional(),
  accessibilityFeatures: z.array(z.string()).optional(),
  roomCharacteristics: z.object({
    lighting: z.string().optional(),
    acoustics: z.string().optional(),
    airConditioning: z.boolean().optional(),
    naturalLight: z.boolean().optional(),
  }).optional(),
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
  enhancement?: {
    building?: string
    floor?: string
    equipment?: string[]
    accessibilityFeatures?: string[]
    roomCharacteristics?: {
      lighting?: string
      acoustics?: string
      airConditioning?: boolean
      naturalLight?: boolean
    }
  }
}

interface EnhancedRoomFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room
  onSuccess: () => void
}

const EQUIPMENT_OPTIONS = [
  "Projector",
  "Smart Board",
  "Whiteboard",
  "Computer",
  "Audio System",
  "Microphone",
  "WiFi",
  "Air Conditioning",
  "Laboratory Equipment",
  "Microscopes",
  "Fume Hood",
  "Safety Equipment",
  "Electrical Outlets",
  "Network Ports"
]

const ACCESSIBILITY_OPTIONS = [
  "Wheelchair Accessible",
  "Elevator Access",
  "Ramp Access",
  "Wide Doorways",
  "Accessible Restrooms",
  "Hearing Loop",
  "Visual Aids",
  "Braille Signage"
]

export function EnhancedRoomForm({ open, onOpenChange, room, onSuccess }: EnhancedRoomFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const isEditing = !!room

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name || "",
      type: room?.type || RoomType.CLASSROOM,
      minCapacity: room?.minCapacity || "",
      maxCapacity: room?.maxCapacity || "",
      building: room?.enhancement?.building || "",
      floor: room?.enhancement?.floor || "",
      equipment: room?.enhancement?.equipment || [],
      accessibilityFeatures: room?.enhancement?.accessibilityFeatures || [],
      roomCharacteristics: {
        lighting: room?.enhancement?.roomCharacteristics?.lighting || "",
        acoustics: room?.enhancement?.roomCharacteristics?.acoustics || "",
        airConditioning: room?.enhancement?.roomCharacteristics?.airConditioning || false,
        naturalLight: room?.enhancement?.roomCharacteristics?.naturalLight || false,
      },
    },
  })

  const selectedType = form.watch("type")
  const minCapacity = form.watch("minCapacity")
  const maxCapacity = form.watch("maxCapacity")

  // Calculate optimal capacity (80% of max)
  const optimalCapacity = typeof maxCapacity === 'number' ? Math.floor(maxCapacity * 0.8) : null

  const onSubmit = async (data: RoomFormData) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/rooms/${room.id}` : '/api/rooms'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Prepare the data with enhancement information
      const submitData = {
        name: data.name,
        type: data.type,
        minCapacity: data.minCapacity || undefined,
        maxCapacity: data.maxCapacity || undefined,
        enhancement: {
          building: data.building || undefined,
          floor: data.floor || undefined,
          equipment: data.equipment || [],
          accessibilityFeatures: data.accessibilityFeatures || [],
          roomCharacteristics: data.roomCharacteristics,
          capacity: data.maxCapacity || 0,
          optimalCapacity: optimalCapacity || 0,
        }
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

  const handleClose = () => {
    form.reset()
    setActiveTab("basic")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {isEditing ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {isEditing 
                  ? 'Update room information and facilities.' 
                  : 'Create a comprehensive room profile with facilities and equipment.'}
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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="capacity" className="gap-2">
                      <Users className="h-4 w-4" />
                      Capacity
                    </TabsTrigger>
                    <TabsTrigger value="equipment" className="gap-2">
                      <Monitor className="h-4 w-4" />
                      Equipment
                    </TabsTrigger>
                    <TabsTrigger value="features" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Features
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-500" />
                          Room Identification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Room Name *
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Room 101, Computer Lab A" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Unique identifier for the room
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  {selectedType === RoomType.LAB ? (
                                    <FlaskConical className="h-4 w-4" />
                                  ) : (
                                    <School className="h-4 w-4" />
                                  )}
                                  Room Type *
                                </FormLabel>
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
                                    <SelectItem value={RoomType.CLASSROOM}>
                                      <div className="flex items-center gap-2">
                                        <School className="h-4 w-4" />
                                        Classroom
                                      </div>
                                    </SelectItem>
                                    <SelectItem value={RoomType.LAB}>
                                      <div className="flex items-center gap-2">
                                        <FlaskConical className="h-4 w-4" />
                                        Laboratory
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Primary function of the room
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="building"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  Building
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Main Building, Science Block" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Building where the room is located
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="floor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Layers className="h-4 w-4" />
                                  Floor
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Ground Floor, 1st Floor, 2nd Floor" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Floor level of the room
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="capacity" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5 text-emerald-500" />
                          Capacity Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="minCapacity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Minimum Capacity
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="e.g., 10"
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      field.onChange(value === '' ? '' : parseInt(value))
                                    }}
                                    value={field.value === '' ? '' : field.value}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Minimum number of students for effective use
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="maxCapacity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Maximum Capacity
                                </FormLabel>
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
                                <FormDescription>
                                  Maximum number of students the room can accommodate
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {optimalCapacity && (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-emerald-600" />
                              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                Capacity Analysis
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Minimum:</span>
                                <p className="font-medium">{minCapacity || 'Not set'} students</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Optimal (80%):</span>
                                <p className="font-medium text-emerald-600">{optimalCapacity} students</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Maximum:</span>
                                <p className="font-medium">{maxCapacity} students</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="equipment" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Monitor className="h-5 w-5 text-purple-500" />
                          Available Equipment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="equipment"
                          render={() => (
                            <FormItem>
                              <FormLabel>Select Available Equipment</FormLabel>
                              <FormDescription className="mb-4">
                                Choose all equipment and facilities available in this room
                              </FormDescription>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {EQUIPMENT_OPTIONS.map((item) => (
                                  <FormField
                                    key={item}
                                    control={form.control}
                                    name="equipment"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={item}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(item)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...(field.value || []), item])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== item
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal">
                                            {item}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Accessibility className="h-5 w-5 text-orange-500" />
                          Accessibility Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="accessibilityFeatures"
                          render={() => (
                            <FormItem>
                              <FormLabel>Accessibility Features</FormLabel>
                              <FormDescription className="mb-4">
                                Select all accessibility features available in this room
                              </FormDescription>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {ACCESSIBILITY_OPTIONS.map((item) => (
                                  <FormField
                                    key={item}
                                    control={form.control}
                                    name="accessibilityFeatures"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={item}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(item)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...(field.value || []), item])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== item
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal">
                                            {item}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          Room Characteristics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="roomCharacteristics.lighting"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  Lighting Type
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select lighting type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="excellent">Excellent</SelectItem>
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="average">Average</SelectItem>
                                    <SelectItem value="poor">Poor</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="roomCharacteristics.acoustics"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Volume2 className="h-4 w-4" />
                                  Acoustics Quality
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select acoustics quality" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="excellent">Excellent</SelectItem>
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="average">Average</SelectItem>
                                    <SelectItem value="poor">Poor</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="roomCharacteristics.airConditioning"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Air Conditioning Available
                                  </FormLabel>
                                  <FormDescription>
                                    Room has climate control system
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="roomCharacteristics.naturalLight"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Natural Light Available
                                  </FormLabel>
                                  <FormDescription>
                                    Room has windows with natural lighting
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
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
                {isEditing ? 'Update Room' : 'Create Room'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}