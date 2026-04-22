"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toastUtils } from "@/lib/toast-utils"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Settings,
  FileSpreadsheet
} from "lucide-react"
import { 
  BulkPreferenceData, 
  BulkOperationResult, 
  PreferenceTemplate 
} from "@/types/faculty-preferences"

export function BulkPreferenceManager() {
  const [activeTab, setActiveTab] = useState("export")
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState<PreferenceTemplate | null>(null)
  const [importData, setImportData] = useState("")
  const [importResult, setImportResult] = useState<BulkOperationResult | null>(null)
  const [exportData, setExportData] = useState<BulkPreferenceData[] | null>(null)

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/faculty-preferences/bulk')
      const data = await response.json()
      
      if (data.success) {
        setTemplate(data.data)
        toastUtils.success('Template Loaded', 'Bulk import template has been generated.')
      } else {
        toastUtils.error('Failed to Load Template', data.error)
      }
    } catch (error) {
      console.error('Error loading template:', error)
      toastUtils.error('Error', 'Failed to load bulk template.')
    } finally {
      setLoading(false)
    }
  }

  const exportPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/faculty-preferences/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setExportData(data.data)
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
          type: 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `faculty-preferences-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toastUtils.exportCompleted('Faculty Preferences', a.download)
      } else {
        toastUtils.error('Export Failed', data.error)
      }
    } catch (error) {
      console.error('Error exporting preferences:', error)
      toastUtils.error('Export Failed', 'An error occurred during export.')
    } finally {
      setLoading(false)
    }
  }

  const importPreferences = async () => {
    try {
      if (!importData.trim()) {
        toastUtils.error('No Data', 'Please paste the import data first.')
        return
      }

      setLoading(true)
      let parsedData
      
      try {
        parsedData = JSON.parse(importData)
      } catch (parseError) {
        toastUtils.error('Invalid JSON', 'The import data is not valid JSON format.')
        return
      }

      const response = await fetch('/api/faculty-preferences/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'import', 
          data: parsedData 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setImportResult(data.data)
        toastUtils.success(
          'Import Completed', 
          `${data.data.successful} successful, ${data.data.failed} failed`
        )
      } else {
        toastUtils.error('Import Failed', data.error)
      }
    } catch (error) {
      console.error('Error importing preferences:', error)
      toastUtils.error('Import Failed', 'An error occurred during import.')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    if (!template) return

    const blob = new Blob([JSON.stringify(template.faculty, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faculty-preferences-template.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toastUtils.success('Template Downloaded', 'You can now edit and import the template.')
  }

  const downloadCSVTemplate = () => {
    if (!template) return

    // Create CSV headers
    const headers = [
      'Faculty ID',
      'Faculty Name',
      'Email',
      'Department',
      'Max Daily Hours',
      'Max Consecutive Hours',
      'Max Courses Per Day',
      'Preferred Break Duration',
      'Avoid Back to Back',
      'Preferred Days',
      'Unavailable Days',
      'Preferred Room Types',
      'Preferred Course Types',
      'Flexibility Level',
      'Priority Level'
    ]

    // Create CSV rows
    const rows = template.faculty.map(faculty => [
      faculty.facultyId,
      faculty.facultyName,
      faculty.facultyEmail,
      faculty.department || '',
      faculty.preferences.maxDailyHours,
      faculty.preferences.maxConsecutiveHours,
      faculty.preferences.maxCoursesPerDay,
      faculty.preferences.preferredBreakDuration,
      faculty.preferences.avoidBackToBackClasses,
      faculty.preferences.preferredDays.join(';'),
      faculty.preferences.unavailableDays.join(';'),
      faculty.preferences.preferredRoomTypes.join(';'),
      faculty.preferences.preferredCourseTypes.join(';'),
      faculty.preferences.flexibilityLevel,
      faculty.preferences.priorityLevel
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faculty-preferences-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toastUtils.success('CSV Template Downloaded', 'You can edit this in Excel or Google Sheets.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Bulk Preference Management
        </h2>
        <p className="text-gray-600">Import and export faculty preferences in bulk</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Template
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Faculty Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Export all current faculty preferences to a JSON file that can be edited and re-imported.
              </p>
              
              <Button 
                onClick={exportPreferences} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Exporting...' : 'Export All Preferences'}
              </Button>

              {exportData && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully exported preferences for {exportData.length} faculty members.
                    The file has been downloaded to your computer.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Faculty Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Import faculty preferences from a JSON file. This will update existing preferences or create new ones.
              </p>

              <div>
                <Label htmlFor="importData">Paste JSON Data</Label>
                <Textarea
                  id="importData"
                  placeholder="Paste the JSON data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                onClick={importPreferences} 
                disabled={loading || !importData.trim()}
                className="w-full"
              >
                {loading ? 'Importing...' : 'Import Preferences'}
              </Button>

              {importResult && (
                <div className="space-y-2">
                  <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          Import completed: {importResult.successful} successful, {importResult.failed} failed
                        </div>
                        {importResult.successful > 0 && (
                          <Progress 
                            value={(importResult.successful / (importResult.successful + importResult.failed)) * 100} 
                            className="h-2"
                          />
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>

                  {importResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Errors:</div>
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="text-sm">• {error}</div>
                          ))}
                          {importResult.errors.length > 5 && (
                            <div className="text-sm">... and {importResult.errors.length - 5} more errors</div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Download Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Download templates with all faculty members and empty preferences that you can fill out and import.
              </p>

              <div className="flex gap-4">
                <Button 
                  onClick={loadTemplate} 
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Loading...' : 'Generate Template'}
                </Button>

                {template && (
                  <>
                    <Button onClick={downloadTemplate} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button onClick={downloadCSVTemplate} variant="outline">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </>
                )}
              </div>

              {template && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Template generated for {template.faculty.length} faculty members.
                      Choose JSON for full functionality or CSV for simple editing.
                    </AlertDescription>
                  </Alert>

                  {/* Template Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Template Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Faculty Members ({template.faculty.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {template.faculty.slice(0, 6).map(faculty => (
                            <div key={faculty.facultyId} className="text-sm p-2 border rounded">
                              <div className="font-medium">{faculty.facultyName}</div>
                              <div className="text-gray-600">{faculty.facultyEmail}</div>
                              {faculty.department && (
                                <div className="text-gray-500">{faculty.department}</div>
                              )}
                            </div>
                          ))}
                          {template.faculty.length > 6 && (
                            <div className="text-sm p-2 border rounded text-center text-gray-500">
                              +{template.faculty.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium">Reference Data</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="font-medium">Time Slots</div>
                            {template.reference.timeSlots.map(slot => (
                              <div key={slot.id}>{slot.start}-{slot.end}</div>
                            ))}
                          </div>
                          <div>
                            <div className="font-medium">Days</div>
                            {template.reference.days.map(day => (
                              <div key={day}>{day}</div>
                            ))}
                          </div>
                          <div>
                            <div className="font-medium">Flexibility Levels</div>
                            {template.reference.flexibilityLevels.map(level => (
                              <div key={level}>{level}</div>
                            ))}
                          </div>
                          <div>
                            <div className="font-medium">Priority Levels</div>
                            {template.reference.priorityLevels.map(level => (
                              <div key={level}>{level}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}