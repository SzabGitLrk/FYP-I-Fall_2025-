"use client"

import { useState, useRef } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MapPin,
  X,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface BulkRoomFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ImportResult {
  success: boolean
  message: string
  data?: {
    total: number
    successful: number
    failed: number
    errors: Array<{
      row: number
      error: string
      data: any
    }>
  }
}

export function BulkRoomForm({ open, onOpenChange, onSuccess }: BulkRoomFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setImportResult(null)
    setUploadProgress(0)
    onOpenChange(false)
  }

  const downloadTemplate = () => {
    const csvContent = `name,type,minCapacity,maxCapacity,building,floor,equipment,accessibilityFeatures,lighting,acoustics,airConditioning,naturalLight
Room 101,CLASSROOM,20,50,Main Building,1st Floor,"Projector,Whiteboard,WiFi","Wheelchair Accessible,Wide Doorways",excellent,good,true,true
Computer Lab A,LAB,15,30,Science Block,2nd Floor,"Computers,Projector,Air Conditioning","Wheelchair Accessible,Elevator Access",good,excellent,true,false
Lecture Hall 1,CLASSROOM,50,100,Main Building,Ground Floor,"Projector,Audio System,Microphone","Wheelchair Accessible,Hearing Loop",excellent,excellent,true,true
Chemistry Lab,LAB,10,25,Science Block,1st Floor,"Laboratory Equipment,Fume Hood,Safety Equipment","Wheelchair Accessible,Wide Doorways",good,average,true,false`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'room_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Template downloaded successfully')
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/rooms/bulk-import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()
      setImportResult(result)

      if (result.success) {
        toast.success(`Successfully imported ${result.data.successful} rooms`)
        if (result.data.failed > 0) {
          toast.warning(`${result.data.failed} rooms failed to import`)
        }
        onSuccess()
      } else {
        toast.error(result.message || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import rooms')
      setImportResult({
        success: false,
        message: 'Failed to import rooms. Please try again.'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Upload className="h-6 w-6 text-primary" />
                Bulk Import Rooms
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Import multiple rooms from a CSV file
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
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Import Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Required Fields:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• name (unique room name)</li>
                      <li>• type (CLASSROOM or LAB)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Optional Fields:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• minCapacity, maxCapacity</li>
                      <li>• building, floor</li>
                      <li>• equipment (comma-separated)</li>
                      <li>• accessibilityFeatures</li>
                      <li>• lighting, acoustics</li>
                      <li>• airConditioning, naturalLight</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Download the template below to ensure proper formatting
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Field Guidelines:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <strong>type:</strong> Must be exactly "CLASSROOM" or "LAB"</li>
                    <li>• <strong>equipment:</strong> Separate multiple items with commas</li>
                    <li>• <strong>lighting/acoustics:</strong> Use "excellent", "good", "average", or "poor"</li>
                    <li>• <strong>airConditioning/naturalLight:</strong> Use "true" or "false"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-500" />
                  Download Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">Room Import Template</p>
                      <p className="text-sm text-muted-foreground">CSV file with sample room data</p>
                    </div>
                  </div>
                  <Button onClick={downloadTemplate} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-purple-500" />
                  Upload CSV File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-muted rounded-full">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Drop your CSV file here</p>
                      <p className="text-muted-foreground">or click to browse</p>
                    </div>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">Importing rooms...</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Processing CSV file and creating room records
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Results */}
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Import Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {importResult.success && importResult.data ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{importResult.data.total}</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Total Records</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{importResult.data.successful}</p>
                          <p className="text-sm text-green-700 dark:text-green-300">Successful</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{importResult.data.failed}</p>
                          <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
                        </div>
                      </div>

                      {importResult.data.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Import Errors
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {importResult.data.errors.map((error, index) => (
                              <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                  Row {error.row}: {error.error}
                                </p>
                                {error.data && (
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Data: {JSON.stringify(error.data)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-red-700 dark:text-red-300">{importResult.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </ScrollArea>

        <DialogFooter className="shrink-0 p-6 pt-0 gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {importResult?.success && (
            <Button onClick={handleClose} className="gap-2">
              <MapPin className="h-4 w-4" />
              View Rooms
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}