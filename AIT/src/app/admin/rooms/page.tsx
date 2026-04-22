"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-states"
import { EnhancedRoomForm } from "@/components/forms/enhanced-room-form"
import { BulkRoomForm } from "@/components/forms/bulk-room-form"
import { RoomDetailsModal } from "@/components/modals/room-details-modal"
import { DeleteDialog } from "@/components/ui/delete-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  School, 
  FlaskConical, 
  Calendar, 
  Edit, 
  Trash2,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Layers,
  Eye,
  Upload,
  Sparkles,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import { RoomType } from "@/lib/types"
import { motion } from "framer-motion"

interface Course {
  id: number
  name: string
  code: string
  type: string
  semester: {
    number: number
    program: {
      name: string
    }
  }
}

interface TimeSlot {
  id: number
  start: string
  end: string
}

interface TimetableEntry {
  id: number
  day: string
  course: Course
  timeslot: TimeSlot
}

interface Room {
  id: number
  name: string
  type: RoomType
  minCapacity?: number
  maxCapacity?: number
  createdAt: string
  timetable: TimetableEntry[]
  enhancement?: {
    building?: string
    floor?: string
    capacity?: number
    optimalCapacity?: number
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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'classroom' | 'lab'>('all')

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      const result = await response.json()
      
      if (result.success) {
        setRooms(result.data)
      } else {
        toast.error('Failed to fetch rooms')
      }
    } catch (error) {
      toast.error('Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRoom) return
    
    try {
      const response = await fetch(`/api/rooms/${deletingRoom.id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Room deleted successfully')
        fetchRooms()
      } else {
        toast.error(result.error || 'Failed to delete room')
      }
    } catch (error) {
      toast.error('Failed to delete room')
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
  }

  const handleView = (room: Room) => {
    setViewingRoom(room)
  }

  const handleDeleteClick = (room: Room) => {
    setDeletingRoom(room)
  }

  const handleFormSuccess = () => {
    fetchRooms()
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.timetable.some(entry => 
                           entry.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           entry.course.code.toLowerCase().includes(searchQuery.toLowerCase())
                         )
    
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'classroom' && room.type === RoomType.CLASSROOM) ||
                      (activeTab === 'lab' && room.type === RoomType.LAB)
    
    return matchesSearch && matchesTab
  })

  // Statistics
  const classroomCount = rooms.filter(room => room.type === RoomType.CLASSROOM).length
  const labCount = rooms.filter(room => room.type === RoomType.LAB).length
  const scheduledRooms = rooms.filter(room => room.timetable.length > 0).length
  const totalSessions = rooms.reduce((acc, room) => acc + room.timetable.length, 0)

  const roomGradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-violet-500',
    'from-rose-500 to-pink-500',
  ]

  const getRoomTypeIcon = (type: RoomType) => {
    return type === RoomType.LAB ? FlaskConical : School
  }

  const getRoomTypeColor = (type: RoomType) => {
    return type === RoomType.LAB ? "text-purple-600" : "text-blue-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading rooms..." />
      </div>
    )
  }

  if (rooms.length === 0 && !showEnhancedForm) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Rooms</h1>
            </div>
            <p className="text-white/90 text-lg">Manage classrooms and laboratory spaces</p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
        </motion.div>
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="No rooms found"
          description="Get started by adding your first room"
          action={{
            label: "Add Room",
            onClick: () => setShowEnhancedForm(true)
          }}
        />
        <EnhancedRoomForm
          open={showEnhancedForm}
          onOpenChange={setShowEnhancedForm}
          onSuccess={handleFormSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Rooms</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage classrooms and laboratory spaces for course scheduling
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-white text-cyan-600 hover:bg-white/90 shadow-lg gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Room
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Add Room</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowEnhancedForm(true)} className="gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Enhanced Form
                  <Badge variant="secondary" className="ml-auto text-xs">Full</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBulkForm(true)} className="gap-2">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Bulk Import
                  <Badge variant="secondary" className="ml-auto text-xs">CSV</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-cyan-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Rooms</p>
                  <p className="text-4xl font-bold">{rooms.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Classrooms</p>
                  <p className="text-4xl font-bold">{classroomCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500">
                  <School className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Laboratories</p>
                  <p className="text-4xl font-bold">{labCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <FlaskConical className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p>
                  <p className="text-4xl font-bold">{totalSessions}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by room name or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="all" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  All ({rooms.length})
                </TabsTrigger>
                <TabsTrigger value="classroom" className="gap-2">
                  <School className="h-4 w-4" />
                  Classrooms ({classroomCount})
                </TabsTrigger>
                <TabsTrigger value="lab" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Labs ({labCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first room'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowEnhancedForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room, index) => {
            const gradient = roomGradients[index % roomGradients.length]
            const isScheduled = room.timetable.length > 0
            const uniqueCourses = new Set(room.timetable.map(entry => entry.course.id)).size
            const uniqueDays = new Set(room.timetable.map(entry => entry.day)).size
            const Icon = getRoomTypeIcon(room.type)
            
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-300 h-full group">
                  {/* Gradient Top Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradient}`} />
                  
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={room.type === RoomType.LAB ? "secondary" : "default"}>
                          {room.type === RoomType.LAB ? "Laboratory" : "Classroom"}
                        </Badge>
                        {isScheduled ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            In Use
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="capitalize">{room.type.toLowerCase()} Space</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{uniqueCourses}</p>
                          <p className="text-xs text-muted-foreground">Courses</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{room.timetable.length}</p>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Info */}
                    <div className="pt-3 border-t">
                      {isScheduled ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{uniqueDays} days per week</span>
                          </div>
                          {room.timetable.length > 0 && (
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {room.timetable.slice(0, 3).map((entry) => (
                                <div key={entry.id} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/50">
                                  <Layers className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{entry.course.code}</p>
                                    <p className="text-muted-foreground">
                                      {entry.day} • {entry.timeslot.start}-{entry.timeslot.end}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {room.timetable.length > 3 && (
                                <p className="text-xs text-center text-muted-foreground py-1">
                                  +{room.timetable.length - 3} more sessions
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground italic">
                          No sessions scheduled
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(room)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(room)} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Room
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(room)}
                            disabled={room.timetable.length > 0}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-lg`} />
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <EnhancedRoomForm
        open={showEnhancedForm}
        onOpenChange={setShowEnhancedForm}
        onSuccess={handleFormSuccess}
      />

      <BulkRoomForm
        open={showBulkForm}
        onOpenChange={setShowBulkForm}
        onSuccess={handleFormSuccess}
      />

      <EnhancedRoomForm
        open={!!editingRoom}
        onOpenChange={(open) => !open && setEditingRoom(null)}
        room={editingRoom || undefined}
        onSuccess={handleFormSuccess}
      />

      <RoomDetailsModal
        open={!!viewingRoom}
        onOpenChange={(open) => !open && setViewingRoom(null)}
        room={viewingRoom}
        onEdit={(room) => {
          setViewingRoom(null)
          handleEdit(room)
        }}
      />

      <DeleteDialog
        open={!!deletingRoom}
        onOpenChange={(open) => !open && setDeletingRoom(null)}
        title="Delete Room"
        description={`Are you sure you want to delete "${deletingRoom?.name}"? ${
          deletingRoom?.timetable.length ? 
          'This room is being used in the timetable and cannot be deleted. Please remove it from the timetable first.' :
          'This action cannot be undone.'
        }`}
        onConfirm={handleDelete}
      />
    </div>
  )
}