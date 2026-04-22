"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Filter, 
  X, 
  Save, 
  Star, 
  Search,
  BookOpen,
  Users,
  MapPin,
  Clock,
  HelpCircle
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FilterState {
  programId?: number
  semesterId?: number
  courseType?: 'THEORY' | 'LAB'
  facultyId?: number
  roomType?: 'CLASSROOM' | 'LAB'
  timeSlotId?: number
  searchQuery?: string
}

interface FilterPreset {
  id: string
  name: string
  filters: FilterState
  isDefault?: boolean
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
}

export function AdvancedFilters({ onFilterChange, currentFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(currentFilters)
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [presetName, setPresetName] = useState("")
  const [programs, setPrograms] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])

  useEffect(() => {
    loadData()
    loadPresets()
  }, [])

  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters])

  const loadData = async () => {
    try {
      const [programsRes, facultyRes, timeSlotsRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/faculty'),
        fetch('/api/timeslots')
      ])

      const [programsData, facultyData, timeSlotsData] = await Promise.all([
        programsRes.json(),
        facultyRes.json(),
        timeSlotsRes.json()
      ])

      setPrograms(programsData.data || [])
      setFaculty(facultyData.data || [])
      setTimeSlots(timeSlotsData.data || [])

      // Load semesters for selected program
      if (filters.programId) {
        const semestersRes = await fetch(`/api/semesters?programId=${filters.programId}`)
        const semestersData = await semestersRes.json()
        setSemesters(semestersData.data || [])
      }
    } catch (error) {
      console.error('Failed to load filter data:', error)
    }
  }

  const loadPresets = () => {
    const savedPresets = localStorage.getItem('timetable-filter-presets')
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets))
    }
  }

  const savePresets = (newPresets: FilterPreset[]) => {
    localStorage.setItem('timetable-filter-presets', JSON.stringify(newPresets))
    setPresets(newPresets)
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    // Convert "all" to undefined for clearing filters
    const processedValue = value === "all" ? undefined : value
    const newFilters = { ...filters, [key]: processedValue }
    setFilters(newFilters)
    
    // Load semesters when program changes
    if (key === 'programId' && processedValue) {
      loadSemesters(processedValue)
    }
  }

  const loadSemesters = async (programId: number) => {
    try {
      const response = await fetch(`/api/semesters?programId=${programId}`)
      const data = await response.json()
      setSemesters(data.data || [])
    } catch (error) {
      console.error('Failed to load semesters:', error)
    }
  }

  const applyFilters = () => {
    onFilterChange(filters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    const clearedFilters = {}
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const savePreset = () => {
    if (!presetName.trim()) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters }
    }

    const newPresets = [...presets, newPreset]
    savePresets(newPresets)
    setPresetName("")
  }

  const loadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
    onFilterChange(preset.filters)
    setIsOpen(false)
  }

  const deletePreset = (presetId: string) => {
    const newPresets = presets.filter(p => p.id !== presetId)
    savePresets(newPresets)
  }

  const getActiveFilterCount = () => {
    return Object.values(currentFilters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length
  }

  const quickFilters = [
    {
      name: "Lab Sessions Only",
      filters: { courseType: 'LAB' as const },
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      name: "Theory Classes Only", 
      filters: { courseType: 'THEORY' as const },
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      name: "Morning Sessions",
      filters: { timeSlotId: timeSlots.find(ts => ts.start <= '12:00')?.id },
      icon: <Clock className="h-4 w-4" />
    },
    {
      name: "Lab Rooms Only",
      filters: { roomType: 'LAB' as const },
      icon: <MapPin className="h-4 w-4" />
    }
  ]

  return (
    <div className="flex items-center gap-2">
      {/* Quick Filter Buttons */}
      <div className="hidden lg:flex items-center gap-2">
        {quickFilters.map((quickFilter) => (
          <Tooltip key={quickFilter.name}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterChange(quickFilter.filters)}
                className="flex items-center gap-2"
              >
                {quickFilter.icon}
                <span className="hidden xl:inline">{quickFilter.name}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{quickFilter.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Advanced Filters */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Search</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search across course names, codes, faculty names, and room names</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses, faculty, rooms..."
                    value={filters.searchQuery || ''}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Program */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Program</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter by academic program (e.g., Computer Science, Engineering)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={filters.programId?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('programId', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semester */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Semester</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter by semester within the selected program</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={filters.semesterId?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('semesterId', value === 'all' ? undefined : parseInt(value))}
                  disabled={!filters.programId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.number === 1 ? '1st' : 
                         semester.number === 2 ? '2nd' : 
                         semester.number === 3 ? '3rd' : 
                         `${semester.number}th`} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Course Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Theory: Lecture-based courses | Lab: Practical/hands-on courses</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={filters.courseType || 'all'}
                  onValueChange={(value) => handleFilterChange('courseType', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="THEORY">Theory</SelectItem>
                    <SelectItem value="LAB">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Faculty */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Faculty</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter by assigned faculty member</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={filters.facultyId?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('facultyId', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Faculty</SelectItem>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Room Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Classroom: Regular lecture rooms | Lab: Specialized equipment rooms</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={filters.roomType || 'all'}
                  onValueChange={(value) => handleFilterChange('roomType', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types</SelectItem>
                    <SelectItem value="CLASSROOM">Classroom</SelectItem>
                    <SelectItem value="LAB">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Slot */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Time Slot</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter by specific time periods (e.g., 9:00 AM - 10:30 AM)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={filters.timeSlotId?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('timeSlotId', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time Slots</SelectItem>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id.toString()}>
                        {slot.start} - {slot.end}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Presets */}
              {presets.length > 0 && (
                <div className="space-y-2">
                  <Label>Saved Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPreset(preset)}
                          className="flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" />
                          {preset.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePreset(preset.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Preset */}
              <div className="space-y-2">
                <Label>Save Current Filters</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={savePreset}
                    disabled={!presetName.trim()}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}