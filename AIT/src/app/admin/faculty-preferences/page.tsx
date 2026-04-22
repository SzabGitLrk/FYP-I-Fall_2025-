"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { LoadingSpinner } from "@/components/ui/loading-states"
import { FacultyPreferenceForm } from "@/components/faculty/faculty-preference-form"
import { PreferenceCalendar } from "@/components/faculty/preference-calendar"
import { PreferenceSummary } from "@/components/faculty/preference-summary"
import { BulkPreferenceManager } from "@/components/faculty/bulk-preference-manager"
import { toastUtils } from "@/lib/toast-utils"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { 
  Users, 
  Settings, 
  Calendar, 
  Search, 
  Plus, 
  Edit,
  Eye,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  HelpCircle
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  FacultyPreferencesWithFaculty,
  TimeSlotPreference,
  UnavailableTimeSlot,
  PreferenceLevel
} from "@/types/faculty-preferences"

interface Faculty {
  id: number
  name: string
  email: string
  department?: string
}

export default function FacultyPreferencesPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [preferences, setPreferences] = useState<FacultyPreferencesWithFaculty[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'calendar' | 'bulk'>('list')
  const [filterDepartment, setFilterDepartment] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load faculty
      const facultyResponse = await fetch('/api/faculty')
      const facultyData = await facultyResponse.json()
      
      // Load preferences
      const preferencesResponse = await fetch('/api/faculty-preferences')
      const preferencesData = await preferencesResponse.json()
      
      // Load time slots
      const timeSlotsResponse = await fetch('/api/timeslots')
      const timeSlotsData = await timeSlotsResponse.json()
      
      if (facultyData.success) {
        setFaculty(facultyData.data)
      }
      
      if (preferencesData.success) {
        setPreferences(preferencesData.data)
      }
      
      if (timeSlotsData.success) {
        setTimeSlots(timeSlotsData.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toastUtils.error('Failed to load data', 'Please refresh the page and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = (timeSlotId: number, dayOfWeek: string, preference: PreferenceLevel | null) => {
    if (!selectedFaculty) return
    
    // This would update the preferences in the calendar view
    // Implementation depends on how you want to handle real-time updates
    console.log('Preference change:', { timeSlotId, dayOfWeek, preference })
  }

  const handleUnavailableChange = (timeSlotId: number, dayOfWeek: string, unavailable: boolean) => {
    if (!selectedFaculty) return
    
    // This would update the unavailable slots in the calendar view
    console.log('Unavailable change:', { timeSlotId, dayOfWeek, unavailable })
  }

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = filterDepartment === "all" || f.department === filterDepartment
    return matchesSearch && matchesDepartment
  })

  const departments = Array.from(new Set(faculty.map(f => f.department).filter(Boolean)))

  const getFacultyPreferences = (facultyId: number) => {
    return preferences.find(p => p.facultyId === facultyId)
  }

  const getPreferenceStatus = (facultyId: number) => {
    const prefs = getFacultyPreferences(facultyId)
    if (!prefs) return { status: 'none', color: 'bg-gray-100 text-gray-800' }
    
    const hasPreferences = prefs.preferredTimeSlots.length > 0 || 
                          prefs.unavailableTimeSlots.length > 0 ||
                          prefs.preferredDays.length > 0
    
    if (!hasPreferences) return { status: 'empty', color: 'bg-yellow-100 text-yellow-800' }
    
    return { status: 'configured', color: 'bg-green-100 text-green-800' }
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalFaculty = faculty.length
    const withPreferences = preferences.filter(p => 
      p.preferredTimeSlots.length > 0 || 
      p.unavailableTimeSlots.length > 0 ||
      p.preferredDays.length > 0
    ).length
    const withoutPreferences = totalFaculty - withPreferences
    const totalPreferredSlots = preferences.reduce((sum, p) => sum + p.preferredTimeSlots.length, 0)
    const totalUnavailableSlots = preferences.reduce((sum, p) => sum + p.unavailableTimeSlots.length, 0)
    
    return {
      totalFaculty,
      withPreferences,
      withoutPreferences,
      totalPreferredSlots,
      totalUnavailableSlots,
      configurationRate: totalFaculty > 0 ? Math.round((withPreferences / totalFaculty) * 100) : 0
    }
  }, [faculty, preferences])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading faculty preferences..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <UserCheck className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Faculty Preferences</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Manage faculty scheduling preferences, time constraints, and availability
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="default"
                className={viewMode === 'list' ? 'bg-white text-violet-600 hover:bg-white/90' : 'bg-white/20 text-white hover:bg-white/30 border-white/30'}
              >
                <Users className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
                size="default"
                disabled={!selectedFaculty}
                className={viewMode === 'calendar' ? 'bg-white text-violet-600 hover:bg-white/90' : 'bg-white/20 text-white hover:bg-white/30 border-white/30'}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === 'bulk' ? 'default' : 'outline'}
                onClick={() => setViewMode('bulk')}
                size="default"
                className={viewMode === 'bulk' ? 'bg-white text-violet-600 hover:bg-white/90' : 'bg-white/20 text-white hover:bg-white/30 border-white/30'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Bulk
              </Button>
            </div>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-violet-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Faculty</p>
                  <p className="text-4xl font-bold">{statistics.totalFaculty}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Configured</p>
                  <p className="text-4xl font-bold">{statistics.withPreferences}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-orange-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-4xl font-bold">{statistics.withoutPreferences}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Preferred Slots</p>
                  <p className="text-4xl font-bold">{statistics.totalPreferredSlots}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="relative overflow-hidden border-2 border-transparent hover:border-rose-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Unavailable</p>
                  <p className="text-4xl font-bold">{statistics.totalUnavailableSlots}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search faculty by name, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full md:w-64 h-12">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept!}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Faculty List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaculty.map((facultyMember, index) => {
              const preferenceStatus = getPreferenceStatus(facultyMember.id)
              const facultyPrefs = getFacultyPreferences(facultyMember.id)
              
              const gradients = [
                'from-violet-500 to-purple-500',
                'from-blue-500 to-cyan-500',
                'from-emerald-500 to-teal-500',
                'from-orange-500 to-red-500',
                'from-rose-500 to-pink-500',
                'from-indigo-500 to-violet-500',
              ]
              const gradient = gradients[index % gradients.length]
              
              return (
                <motion.div
                  key={facultyMember.id}
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
                          <UserCheck className="h-6 w-6 text-white" />
                        </div>
                        <Badge 
                          variant={preferenceStatus.status === 'configured' ? 'default' : 'outline'}
                          className={
                            preferenceStatus.status === 'configured' 
                              ? 'bg-green-500' 
                              : preferenceStatus.status === 'empty'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-500 text-white'
                          }
                        >
                          {preferenceStatus.status === 'none' && (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Set
                            </>
                          )}
                          {preferenceStatus.status === 'empty' && (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Empty
                            </>
                          )}
                          {preferenceStatus.status === 'configured' && (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Configured
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{facultyMember.name}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate">{facultyMember.email}</p>
                      {facultyMember.department && (
                        <Badge variant="outline" className="w-fit mt-2">{facultyMember.department}</Badge>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {facultyPrefs ? (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>Preferred Slots</span>
                            </div>
                            <span className="font-semibold">{facultyPrefs.preferredTimeSlots.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>Unavailable</span>
                            </div>
                            <span className="font-semibold">{facultyPrefs.unavailableTimeSlots.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <BarChart3 className="h-4 w-4 text-emerald-500" />
                              <span>Max Daily Hours</span>
                            </div>
                            <span className="font-semibold">{facultyPrefs.maxDailyHours}h</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <TrendingUp className="h-4 w-4 text-purple-500" />
                              <span>Flexibility</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {facultyPrefs.flexibilityLevel}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm italic">
                          No preferences configured
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFaculty(facultyMember)
                            setViewMode('form')
                          }}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFaculty(facultyMember)
                            setViewMode('calendar')
                          }}
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>

                    {/* Hover Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-lg`} />
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {filteredFaculty.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Faculty Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterDepartment !== 'all'
                    ? "No faculty members match your search criteria."
                    : "No faculty members available."
                  }
                </p>
                {(searchQuery || filterDepartment !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchQuery('')
                      setFilterDepartment('all')
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {viewMode === 'form' && selectedFaculty && (
        <FacultyPreferenceForm
          facultyId={selectedFaculty.id}
          facultyName={selectedFaculty.name}
          onSave={() => {
            loadData()
            setViewMode('list')
          }}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'calendar' && selectedFaculty && (
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Calendar View - {selectedFaculty.name}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Visual preference management and availability tracking
                  </CardDescription>
                </div>
                <Button onClick={() => setViewMode('list')} variant="outline">
                  Back to List
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <PreferenceCalendar
                timeSlots={timeSlots}
                preferredTimeSlots={getFacultyPreferences(selectedFaculty.id)?.preferredTimeSlots || []}
                unavailableTimeSlots={getFacultyPreferences(selectedFaculty.id)?.unavailableTimeSlots || []}
                onPreferenceChange={handlePreferenceChange}
                onUnavailableChange={handleUnavailableChange}
              />
            </CardContent>
          </Card>
          
          {getFacultyPreferences(selectedFaculty.id) && (
            <PreferenceSummary
              preferences={getFacultyPreferences(selectedFaculty.id)!}
              facultyName={selectedFaculty.name}
            />
          )}
        </div>
      )}

      {viewMode === 'bulk' && (
        <BulkPreferenceManager />
      )}
    </div>
  )
}