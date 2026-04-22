"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, Info, Users, Clock, MapPin } from 'lucide-react'

interface PreferenceAnalysis {
  averageSatisfaction: number
  facultySatisfaction: Array<{
    facultyId: number
    facultyName: string
    satisfaction: number
    violations: number
  }>
  totalViolations: number
}

interface PreferenceIntegrationInfoProps {
  className?: string
}

export function PreferenceIntegrationInfo({ className }: PreferenceIntegrationInfoProps) {
  const [analysis, setAnalysis] = useState<PreferenceAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/preference-analysis')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.overall) {
          setAnalysis(data.data.overall)
        }
      }
    } catch (error) {
      console.error('Failed to fetch preference analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const getSatisfactionColor = (satisfaction: number) => {
    if (satisfaction >= 0.8) return 'text-green-600'
    if (satisfaction >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSatisfactionBadge = (satisfaction: number) => {
    if (satisfaction >= 0.8) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
    if (satisfaction >= 0.6) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge variant="destructive">Needs Improvement</Badge>
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Preference Integration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Preference Integration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-gray-500">
            <Info className="h-4 w-4" />
            <span>No preference data available</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Preference Integration Status</span>
        </CardTitle>
        <CardDescription>
          Faculty preference satisfaction in current timetable
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Satisfaction */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className={`h-5 w-5 ${getSatisfactionColor(analysis.averageSatisfaction)}`} />
            <span className="font-medium">Overall Satisfaction</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${getSatisfactionColor(analysis.averageSatisfaction)}`}>
              {Math.round(analysis.averageSatisfaction * 100)}%
            </span>
            {getSatisfactionBadge(analysis.averageSatisfaction)}
          </div>
        </div>

        {/* Violations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Total Violations</span>
          </div>
          <Badge variant={analysis.totalViolations === 0 ? "default" : "destructive"}>
            {analysis.totalViolations}
          </Badge>
        </div>

        {/* Faculty Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Faculty with Preferences</span>
          </div>
          <span className="font-semibold">{analysis.facultySatisfaction.length}</span>
        </div>

        {/* Toggle Details */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? 'Hide Details' : 'Show Faculty Details'}
        </Button>

        {/* Faculty Details */}
        {showDetails && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-medium text-sm text-gray-700">Faculty Satisfaction Breakdown</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {analysis.facultySatisfaction.map((faculty) => (
                <div key={faculty.facultyId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{faculty.facultyName}</div>
                    <div className="text-xs text-gray-500">
                      {faculty.violations} violation{faculty.violations !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-semibold ${getSatisfactionColor(faculty.satisfaction)}`}>
                      {Math.round(faculty.satisfaction * 100)}%
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      faculty.satisfaction >= 0.8 ? 'bg-green-500' :
                      faculty.satisfaction >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Features */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Enhanced Algorithm Features</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Time slot preference optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>Room type preference matching</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Workload balance optimization</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}