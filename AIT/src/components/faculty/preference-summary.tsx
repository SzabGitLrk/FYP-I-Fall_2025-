"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  MapPin,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { 
  FacultyPreferences, 
  PreferenceValidationResult,
  PreferenceSatisfactionScore 
} from "@/types/faculty-preferences"

interface PreferenceSummaryProps {
  preferences: FacultyPreferences
  validationResult?: PreferenceValidationResult
  satisfactionScore?: PreferenceSatisfactionScore
  facultyName: string
  currentSchedule?: Array<{
    day: string
    timeSlot: { start: string; end: string }
    course: { name: string }
    room: { name: string }
  }>
}

export function PreferenceSummary({
  preferences,
  validationResult,
  satisfactionScore,
  facultyName,
  currentSchedule = []
}: PreferenceSummaryProps) {
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getFlexibilityColor = (level: string): string => {
    switch (level) {
      case 'STRICT': return 'bg-red-100 text-red-800'
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800'
      case 'FLEXIBLE': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (level: string): string => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSatisfactionColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Preference Summary</h3>
          <p className="text-sm text-gray-600">Overview of {facultyName}'s preferences and current status</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getFlexibilityColor(preferences.flexibilityLevel)}>
            {preferences.flexibilityLevel}
          </Badge>
          <Badge className={getPriorityColor(preferences.priorityLevel)}>
            {preferences.priorityLevel} Priority
          </Badge>
        </div>
      </div>

      {/* Satisfaction Score */}
      {satisfactionScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Preference Satisfaction Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Satisfaction</span>
                <span className={`text-lg font-bold ${getSatisfactionColor(satisfactionScore.overall)}`}>
                  {(satisfactionScore.overall * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={satisfactionScore.overall * 100} className="h-2" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Time Slots</div>
                  <div className={getSatisfactionColor(satisfactionScore.timeSlotSatisfaction)}>
                    {(satisfactionScore.timeSlotSatisfaction * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Days</div>
                  <div className={getSatisfactionColor(satisfactionScore.dayPreferenceSatisfaction)}>
                    {(satisfactionScore.dayPreferenceSatisfaction * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Workload</div>
                  <div className={getSatisfactionColor(satisfactionScore.workloadSatisfaction)}>
                    {(satisfactionScore.workloadSatisfaction * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Rooms</div>
                  <div className={getSatisfactionColor(satisfactionScore.roomPreferenceSatisfaction)}>
                    {(satisfactionScore.roomPreferenceSatisfaction * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {satisfactionScore.details.violations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Preference Violations</h4>
                  <div className="space-y-2">
                    {satisfactionScore.details.violations.map((violation, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{violation.description}</span>
                        <Badge variant={violation.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                          {violation.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-4">
          {validationResult.conflicts.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Conflicts Detected ({validationResult.conflicts.length})</div>
                  {validationResult.conflicts.map((conflict, index) => (
                    <div key={index} className="text-sm">
                      • {conflict.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validationResult.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Warnings ({validationResult.warnings.length})</div>
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="text-sm">
                      • {warning}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validationResult.suggestions.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Suggestions ({validationResult.suggestions.length})</div>
                  {validationResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Preference Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Time Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-gray-600">
              Preferred: {preferences.preferredTimeSlots.length} slots
            </div>
            <div className="text-xs text-gray-600">
              Unavailable: {preferences.unavailableTimeSlots.length} slots
            </div>
            {preferences.preferredTimeSlots.slice(0, 2).map((pref, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {pref.preference.replace('_', ' ')}
              </Badge>
            ))}
            {preferences.preferredTimeSlots.length > 2 && (
              <div className="text-xs text-gray-500">
                +{preferences.preferredTimeSlots.length - 2} more
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Day Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-gray-600">
              Preferred: {preferences.preferredDays.length} days
            </div>
            <div className="text-xs text-gray-600">
              Unavailable: {preferences.unavailableDays.length} days
            </div>
            <div className="flex flex-wrap gap-1">
              {preferences.preferredDays.slice(0, 3).map(day => (
                <Badge key={day} variant="outline" className="text-xs">
                  {day.slice(0, 3)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workload Limits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Workload Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="text-gray-600">Max Daily:</span> {preferences.maxDailyHours}h
            </div>
            <div className="text-xs">
              <span className="text-gray-600">Max Consecutive:</span> {preferences.maxConsecutiveHours}h
            </div>
            <div className="text-xs">
              <span className="text-gray-600">Max Courses/Day:</span> {preferences.maxCoursesPerDay}
            </div>
            <div className="text-xs">
              <span className="text-gray-600">Break Duration:</span> {preferences.preferredBreakDuration}min
            </div>
          </CardContent>
        </Card>

        {/* Resource Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-gray-600">
              Room Types: {preferences.preferredRoomTypes.length || 'Any'}
            </div>
            <div className="text-xs text-gray-600">
              Course Types: {preferences.preferredCourseTypes.length || 'Any'}
            </div>
            <div className="flex flex-wrap gap-1">
              {preferences.preferredRoomTypes.map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
            {preferences.avoidBackToBackClasses && (
              <Badge variant="secondary" className="text-xs">
                No Back-to-Back
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Schedule Impact */}
      {currentSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Schedule Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Current schedule has {currentSchedule.length} sessions
              </div>
              
              {/* Schedule conflicts with preferences */}
              <div className="space-y-2">
                {currentSchedule.map((session, index) => {
                  const isPreferredDay = preferences.preferredDays.includes(session.day)
                  const isUnavailableDay = preferences.unavailableDays.includes(session.day)
                  
                  return (
                    <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                      <div>
                        <span className="font-medium">{session.course.name}</span>
                        <span className="text-gray-500 ml-2">
                          {session.day} {formatTime(session.timeSlot.start)}-{formatTime(session.timeSlot.end)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnavailableDay && (
                          <Badge variant="destructive" className="text-xs">Unavailable Day</Badge>
                        )}
                        {!isUnavailableDay && isPreferredDay && (
                          <Badge variant="default" className="text-xs">Preferred Day</Badge>
                        )}
                        {!isUnavailableDay && !isPreferredDay && preferences.preferredDays.length > 0 && (
                          <Badge variant="outline" className="text-xs">Non-preferred Day</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}