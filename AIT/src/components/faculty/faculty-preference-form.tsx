"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { toastUtils } from "@/lib/toast-utils"
import { 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  BookOpen,
  Settings,
  User,
  Trash2,
  Plus
} from "lucide-react"
import { 
  FacultyPreferences, 
  TimeSlotPreference, 
  UnavailableTimeSlot,
  TeachingPattern,
  PreferenceValidationResult,
  FlexibilityLevel,
  PriorityLevel,
  PreferenceLevel
} from "@/types/faculty-preferences"

interface FacultyPreferenceFormProps {
  facultyId: number
  facultyName: string
  onSave?: (preferences: FacultyPreferences) => void
  onCancel?: () => void
}

export function FacultyPreferenceForm({ 
  facultyId, 
  facultyName, 
  onSave, 
  onCancel 
}: FacultyPreferenceFormProps) {
  const [preferences, setPreferences] = useState<FacultyPreferences>({
    facultyId,
    preferredTimeSlots: [],
    unavailableTimeSlots: [],
    preferredDays: [],
    unavailableDays: [],
    maxDailyHours: 8,
    maxConsecutiveHours: 4,
    preferredBreakDuration: 30,
    preferredTeachingPatterns: [],
    avoidBackToBackClasses: false,
    preferredRoomTypes: [],
    preferredBuildings: [],
    preferredCourseTypes: [],
    maxCoursesPerDay: 4,
    flexibilityLevel: 'MODERATE',
    priorityLevel: 'MEDIUM'
  })

  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validationResult, setValidationResult] = useState<PreferenceValidationResult | null>(null)
  const [validating, setValidating] = useState(false)

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  const roomTypes = ['CLASSROOM', 'LAB']
  const courseTypes = ['THEORY', 'LAB']
  const flexibilityLevels: FlexibilityLevel[] = ['STRICT', 'MODERATE', 'FLEXIBLE']
  const priorityLevels: PriorityLevel[] = ['HIGH', 'MEDIUM', 'LOW']
  const preferenceLevels: PreferenceLevel[] = ['STRONGLY_PREFER', 'PREFER', 'NEUTRAL', 'AVOID', 'STRONGLY_AVOID']

  useEffect(() => {
    loadData()
  }, [facultyId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load time slots
      const timeSlotsResponse = await fetch('/api/timeslots')
      const timeSlotsData = await timeSlotsResponse.json()
      
      if (timeSlotsData.success) {
        setTimeSlots(timeSlotsData.data)
      }

      // Load existing preferences
      const preferencesResponse = await fetch(`/api/faculty-preferences?facultyId=${facultyId}`)
      const preferencesData = await preferencesResponse.json()
      
      if (preferencesData.success && preferencesData.data) {
        setPreferences(preferencesData.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toastUtils.error('Failed to load data', 'Please refresh the page and try again.')
    } finally {
      setLoading(false)
    }
  }

  const validatePreferences = async () => {
    try {
      setValidating(true)
      const response = await fetch('/api/faculty-preferences/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId, preferences })
      })
      
      const data = await response.json()
      if (data.success) {
        setValidationResult(data.data.validation)
      }
    } catch (error) {
      console.error('Error validating preferences:', error)
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/faculty-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toastUtils.success('Preferences Saved', 'Faculty preferences have been updated successfully.')
        onSave?.(data.data)
      } else {
        toastUtils.error('Save Failed', data.error || 'Failed to save preferences.')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toastUtils.error('Save Failed', 'An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  const addTimeSlotPreference = () => {
    if (timeSlots.length > 0) {
      const newPreference: TimeSlotPreference = {
        timeSlotId: timeSlots[0].id,
        dayOfWeek: 'ANY',
        preference: 'PREFER'
      }
      setPreferences(prev => ({
        ...prev,
        preferredTimeSlots: [...prev.preferredTimeSlots, newPreference]
      }))
    }
  }

  const removeTimeSlotPreference = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.filter((_, i) => i !== index)
    }))
  }

  const updateTimeSlotPreference = (index: number, field: keyof TimeSlotPreference, value: any) => {
    setPreferences(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.map((pref, i) => 
        i === index ? { ...pref, [field]: value } : pref
      )
    }))
  }

  const addUnavailableTimeSlot = () => {
    if (timeSlots.length > 0) {
      const newUnavailable: UnavailableTimeSlot = {
        timeSlotId: timeSlots[0].id,
        dayOfWeek: 'MONDAY',
        reason: ''
      }
      setPreferences(prev => ({
        ...prev,
        unavailableTimeSlots: [...prev.unavailableTimeSlots, newUnavailable]
      }))
    }
  }

  const removeUnavailableTimeSlot = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      unavailableTimeSlots: prev.unavailableTimeSlots.filter((_, i) => i !== index)
    }))
  }

  const updateUnavailableTimeSlot = (index: number, field: keyof UnavailableTimeSlot, value: any) => {
    setPreferences(prev => ({
      ...prev,
      unavailableTimeSlots: prev.unavailableTimeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }))
  }

  const toggleDay = (day: string, type: 'preferred' | 'unavailable') => {
    const field = type === 'preferred' ? 'preferredDays' : 'unavailableDays'
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(day) 
        ? prev[field].filter(d => d !== day)
        : [...prev[field], day]
    }))
  }

  const toggleRoomType = (roomType: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredRoomTypes: prev.preferredRoomTypes.includes(roomType)
        ? prev.preferredRoomTypes.filter(rt => rt !== roomType)
        : [...prev.preferredRoomTypes, roomType]
    }))
  }

  const toggleCourseType = (courseType: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredCourseTypes: prev.preferredCourseTypes.includes(courseType)
        ? prev.preferredCourseTypes.filter(ct => ct !== courseType)
        : [...prev.preferredCourseTypes, courseType]
    }))
  }

  if (loading) {
    return <LoadingSkeleton type="card" rows={6} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6" />
            Faculty Preferences
          </h2>
          <p className="text-gray-600">Configure preferences for {facultyName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={validatePreferences}
            disabled={validating}
          >
            {validating ? 'Validating...' : 'Validate'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conflicts Found:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {validationResult.conflicts.map((conflict, index) => (
                    <li key={index}>{conflict.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {validationResult.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warnings:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {validationResult.suggestions.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Suggestions:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Preference Tabs */}
      <Tabs defaultValue="time" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time
          </TabsTrigger>
          <TabsTrigger value="days" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Days
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Workload
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Time Preferences Tab */}
        <TabsContent value="time" className="space-y-4">
          {/* Preferred Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Time Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferences.preferredTimeSlots.map((pref, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Select
                    value={pref.timeSlotId.toString()}
                    onValueChange={(value) => updateTimeSlotPreference(index, 'timeSlotId', parseInt(value))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.start} - {slot.end}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={pref.dayOfWeek}
                    onValueChange={(value) => updateTimeSlotPreference(index, 'dayOfWeek', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any Day</SelectItem>
                      {days.map(day => (
                        <SelectItem key={day} value={day}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={pref.preference}
                    onValueChange={(value) => updateTimeSlotPreference(index, 'preference', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {preferenceLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Reason (optional)"
                    value={pref.reason || ''}
                    onChange={(e) => updateTimeSlotPreference(index, 'reason', e.target.value)}
                    className="flex-1"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTimeSlotPreference(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button onClick={addTimeSlotPreference} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Preferred Time Slot
              </Button>
            </CardContent>
          </Card>

          {/* Unavailable Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Unavailable Time Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferences.unavailableTimeSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Select
                    value={slot.timeSlotId.toString()}
                    onValueChange={(value) => updateUnavailableTimeSlot(index, 'timeSlotId', parseInt(value))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(ts => (
                        <SelectItem key={ts.id} value={ts.id.toString()}>
                          {ts.start} - {ts.end}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={slot.dayOfWeek}
                    onValueChange={(value) => updateUnavailableTimeSlot(index, 'dayOfWeek', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(day => (
                        <SelectItem key={day} value={day}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Reason"
                    value={slot.reason || ''}
                    onChange={(e) => updateUnavailableTimeSlot(index, 'reason', e.target.value)}
                    className="flex-1"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUnavailableTimeSlot(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button onClick={addUnavailableTimeSlot} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Unavailable Time Slot
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Days Preferences Tab */}
        <TabsContent value="days" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferred Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {days.map(day => (
                    <div key={day} className="flex items-center justify-between">
                      <span>{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                      <Switch
                        checked={preferences.preferredDays.includes(day)}
                        onCheckedChange={() => toggleDay(day, 'preferred')}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unavailable Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {days.map(day => (
                    <div key={day} className="flex items-center justify-between">
                      <span>{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                      <Switch
                        checked={preferences.unavailableDays.includes(day)}
                        onCheckedChange={() => toggleDay(day, 'unavailable')}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workload Preferences Tab */}
        <TabsContent value="workload" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxDailyHours">Maximum Daily Hours</Label>
                  <Input
                    id="maxDailyHours"
                    type="number"
                    min="1"
                    max="12"
                    value={preferences.maxDailyHours}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxDailyHours: parseInt(e.target.value) || 8
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxConsecutiveHours">Maximum Consecutive Hours</Label>
                  <Input
                    id="maxConsecutiveHours"
                    type="number"
                    min="1"
                    max="8"
                    value={preferences.maxConsecutiveHours}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxConsecutiveHours: parseInt(e.target.value) || 4
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxCoursesPerDay">Maximum Courses Per Day</Label>
                  <Input
                    id="maxCoursesPerDay"
                    type="number"
                    min="1"
                    max="8"
                    value={preferences.maxCoursesPerDay}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxCoursesPerDay: parseInt(e.target.value) || 4
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Break Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="preferredBreakDuration">Preferred Break Duration (minutes)</Label>
                  <Input
                    id="preferredBreakDuration"
                    type="number"
                    min="15"
                    max="120"
                    value={preferences.preferredBreakDuration}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      preferredBreakDuration: parseInt(e.target.value) || 30
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="avoidBackToBack">Avoid Back-to-Back Classes</Label>
                  <Switch
                    id="avoidBackToBack"
                    checked={preferences.avoidBackToBackClasses}
                    onCheckedChange={(checked) => setPreferences(prev => ({
                      ...prev,
                      avoidBackToBackClasses: checked
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Preferences Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferred Room Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roomTypes.map(type => (
                      <Badge
                        key={type}
                        variant={preferences.preferredRoomTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleRoomType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferredBuildings">Preferred Buildings</Label>
                  <Input
                    id="preferredBuildings"
                    placeholder="e.g., Main Campus, Engineering Block"
                    value={preferences.preferredBuildings.join(', ')}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      preferredBuildings: e.target.value.split(',').map(b => b.trim()).filter(b => b)
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferred Course Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {courseTypes.map(type => (
                      <Badge
                        key={type}
                        variant={preferences.preferredCourseTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCourseType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Flexibility Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="flexibilityLevel">Flexibility Level</Label>
                  <Select
                    value={preferences.flexibilityLevel}
                    onValueChange={(value: FlexibilityLevel) => setPreferences(prev => ({
                      ...prev,
                      flexibilityLevel: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {flexibilityLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0) + level.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    How flexible you are with your preferences during scheduling
                  </p>
                </div>

                <div>
                  <Label htmlFor="priorityLevel">Priority Level</Label>
                  <Select
                    value={preferences.priorityLevel}
                    onValueChange={(value: PriorityLevel) => setPreferences(prev => ({
                      ...prev,
                      priorityLevel: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0) + level.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    Priority of your preferences relative to other faculty
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}