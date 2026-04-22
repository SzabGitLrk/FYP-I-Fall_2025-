"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  TimeSlotPreference, 
  UnavailableTimeSlot, 
  PreferenceLevel 
} from "@/types/faculty-preferences"
import { cn } from "@/lib/utils"

interface PreferenceCalendarProps {
  timeSlots: Array<{ id: number; start: string; end: string }>
  preferredTimeSlots: TimeSlotPreference[]
  unavailableTimeSlots: UnavailableTimeSlot[]
  onPreferenceChange: (timeSlotId: number, dayOfWeek: string, preference: PreferenceLevel | null) => void
  onUnavailableChange: (timeSlotId: number, dayOfWeek: string, unavailable: boolean) => void
  readOnly?: boolean
}

export function PreferenceCalendar({
  timeSlots,
  preferredTimeSlots,
  unavailableTimeSlots,
  onPreferenceChange,
  onUnavailableChange,
  readOnly = false
}: PreferenceCalendarProps) {
  const [selectedPreference, setSelectedPreference] = useState<PreferenceLevel>('PREFER')
  const [mode, setMode] = useState<'preference' | 'unavailable'>('preference')

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const getPreferenceForSlot = (timeSlotId: number, dayOfWeek: string): PreferenceLevel | null => {
    const preference = preferredTimeSlots.find(
      p => p.timeSlotId === timeSlotId && (p.dayOfWeek === dayOfWeek || p.dayOfWeek === 'ANY')
    )
    return preference?.preference || null
  }

  const isUnavailable = (timeSlotId: number, dayOfWeek: string): boolean => {
    return unavailableTimeSlots.some(
      u => u.timeSlotId === timeSlotId && u.dayOfWeek === dayOfWeek
    )
  }

  const getPreferenceColor = (preference: PreferenceLevel | null): string => {
    switch (preference) {
      case 'STRONGLY_PREFER': return 'bg-green-500 text-white'
      case 'PREFER': return 'bg-green-300 text-green-900'
      case 'NEUTRAL': return 'bg-gray-200 text-gray-700'
      case 'AVOID': return 'bg-red-300 text-red-900'
      case 'STRONGLY_AVOID': return 'bg-red-500 text-white'
      default: return 'bg-white border border-gray-200 hover:bg-gray-50'
    }
  }

  const getPreferenceLabel = (preference: PreferenceLevel | null): string => {
    switch (preference) {
      case 'STRONGLY_PREFER': return 'SP'
      case 'PREFER': return 'P'
      case 'NEUTRAL': return 'N'
      case 'AVOID': return 'A'
      case 'STRONGLY_AVOID': return 'SA'
      default: return ''
    }
  }

  const handleCellClick = (timeSlotId: number, dayOfWeek: string) => {
    if (readOnly) return

    if (mode === 'preference') {
      const currentPreference = getPreferenceForSlot(timeSlotId, dayOfWeek)
      const newPreference = currentPreference === selectedPreference ? null : selectedPreference
      onPreferenceChange(timeSlotId, dayOfWeek, newPreference)
    } else {
      const currentUnavailable = isUnavailable(timeSlotId, dayOfWeek)
      onUnavailableChange(timeSlotId, dayOfWeek, !currentUnavailable)
    }
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Preference Calendar</CardTitle>
          {!readOnly && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Mode:</span>
                <Select value={mode} onValueChange={(value: 'preference' | 'unavailable') => setMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preference">Preference</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {mode === 'preference' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Level:</span>
                  <Select value={selectedPreference} onValueChange={(value: PreferenceLevel) => setSelectedPreference(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRONGLY_PREFER">Strongly Prefer</SelectItem>
                      <SelectItem value="PREFER">Prefer</SelectItem>
                      <SelectItem value="NEUTRAL">Neutral</SelectItem>
                      <SelectItem value="AVOID">Avoid</SelectItem>
                      <SelectItem value="STRONGLY_AVOID">Strongly Avoid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Strongly Prefer (SP)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span>Prefer (P)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Neutral (N)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span>Avoid (A)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Strongly Avoid (SA)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-black rounded"></div>
              <span>Unavailable</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="p-2 font-medium text-center">Time</div>
                {dayLabels.map((day, index) => (
                  <div key={day} className="p-2 font-medium text-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.id} className="grid grid-cols-8 gap-1 mb-1">
                  {/* Time Column */}
                  <div className="p-2 text-xs font-medium bg-gray-50 rounded text-center">
                    <div>{formatTime(timeSlot.start)}</div>
                    <div className="text-gray-500">{formatTime(timeSlot.end)}</div>
                  </div>

                  {/* Day Columns */}
                  {days.map((day) => {
                    const preference = getPreferenceForSlot(timeSlot.id, day)
                    const unavailable = isUnavailable(timeSlot.id, day)
                    
                    return (
                      <button
                        key={day}
                        className={cn(
                          "p-2 h-16 rounded text-xs font-medium transition-colors",
                          unavailable 
                            ? "bg-black text-white" 
                            : getPreferenceColor(preference),
                          !readOnly && "cursor-pointer hover:opacity-80"
                        )}
                        onClick={() => handleCellClick(timeSlot.id, day)}
                        disabled={readOnly}
                        title={
                          unavailable 
                            ? "Unavailable" 
                            : preference 
                              ? preference.replace('_', ' ').toLowerCase()
                              : "Click to set preference"
                        }
                      >
                        {unavailable ? 'X' : getPreferenceLabel(preference)}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {!readOnly && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p><strong>Instructions:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Select mode (Preference or Unavailable) and preference level above</li>
                <li>Click on time slots to set your preferences</li>
                <li>Click again on the same preference level to remove it</li>
                <li>Unavailable slots (marked with X) override all preferences</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}