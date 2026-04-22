"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Download, 
  FileText, 
  Grid3X3, 
  Zap, 
  CheckCircle2, 
  BarChart3, 
  Calendar, 
  Users, 
  Clock, 
  Star,
  Palette,
  Globe,
  Info,
  HelpCircle
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ExportOptionsDialogProps {
  onExport: (options: ExportOptions) => void
  isExporting?: boolean
  disabled?: boolean
}

interface ExportOptions {
  format: 'detailed' | 'compact' | 'grid' | 'analytics'
  includeAnalytics: boolean
  includeCharts: boolean
  includeStudentList: boolean
  colorScheme: 'professional' | 'vibrant' | 'minimal'
  language: 'en' | 'es'
}

const formatOptions = [
  {
    id: 'detailed',
    name: 'Detailed Report',
    description: 'Comprehensive report with cover page, daily schedules, and analytics',
    icon: FileText,
    pages: '8-15 pages',
    estimatedTime: '2-3 min',
    features: ['Cover Page', 'Daily Schedules', 'Analytics', 'Faculty Workload', 'Room Utilization'],
    recommended: true,
    color: 'blue'
  },
  {
    id: 'compact',
    name: 'Compact Summary',
    description: 'Condensed overview with key information and statistics',
    icon: Zap,
    pages: '2-3 pages',
    estimatedTime: '30-60 sec',
    features: ['Quick Overview', 'Key Statistics', 'Summary Grid'],
    recommended: false,
    color: 'green'
  },
  {
    id: 'grid',
    name: 'Weekly Grid',
    description: 'Traditional weekly timetable grid layout',
    icon: Grid3X3,
    pages: '1-2 pages',
    estimatedTime: '15-30 sec',
    features: ['Weekly Grid', 'Clean Layout', 'Print Friendly'],
    recommended: false,
    color: 'purple'
  },
  {
    id: 'analytics',
    name: 'Analytics Only',
    description: 'Focus on statistics, charts, and performance metrics',
    icon: BarChart3,
    pages: '4-6 pages',
    estimatedTime: '1-2 min',
    features: ['Charts & Graphs', 'Performance Metrics', 'Detailed Analysis'],
    recommended: false,
    color: 'orange'
  }
]

const colorSchemes = [
  {
    id: 'professional',
    name: 'Professional Blue',
    description: 'Corporate blue theme with clean design',
    preview: 'bg-gradient-to-r from-blue-600 to-blue-700',
    colors: ['#2563eb', '#1d4ed8', '#1e40af'],
    bestFor: 'Official documents, presentations'
  },
  {
    id: 'vibrant',
    name: 'Vibrant Colors',
    description: 'Colorful theme with purple and teal accents',
    preview: 'bg-gradient-to-r from-purple-600 to-teal-600',
    colors: ['#9333ea', '#0d9488', '#059669'],
    bestFor: 'Creative reports, student materials'
  },
  {
    id: 'minimal',
    name: 'Minimal Gray',
    description: 'Clean minimal design with gray tones',
    preview: 'bg-gradient-to-r from-gray-600 to-gray-700',
    colors: ['#4b5563', '#374151', '#1f2937'],
    bestFor: 'Academic papers, formal reports'
  }
]

export function ExportOptionsDialog({ onExport, isExporting = false, disabled = false }: ExportOptionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'detailed',
    includeAnalytics: true,
    includeCharts: true,
    includeStudentList: false,
    colorScheme: 'professional',
    language: 'en'
  })

  const handleExport = async () => {
    setExportProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      await onExport(options)
      setExportProgress(100)
      setTimeout(() => {
        setOpen(false)
        setExportProgress(0)
      }, 1000)
    } catch (error) {
      clearInterval(progressInterval)
      setExportProgress(0)
    }
  }

  const selectedFormat = formatOptions.find(f => f.id === options.format)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1400px] w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Download className="h-8 w-8" />
                </div>
                Export Timetable PDF
              </DialogTitle>
              
              {/* Quick Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onExport({
                    format: 'detailed',
                    includeAnalytics: true,
                    includeCharts: true,
                    includeStudentList: false,
                    colorScheme: 'professional',
                    language: 'en'
                  })
                  setOpen(false)
                }}
                disabled={isExporting}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Quick Export
              </Button>
            </div>
            
            <DialogDescription className="text-blue-100 text-base mt-3">
              Create professional timetable reports with customizable formats and styling options
            </DialogDescription>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                <Calendar className="h-6 w-6 text-blue-200" />
                <div>
                  <div className="text-xl font-bold">162</div>
                  <div className="text-sm text-blue-200">Sessions</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                <Users className="h-6 w-6 text-green-200" />
                <div>
                  <div className="text-xl font-bold">25</div>
                  <div className="text-sm text-green-200">Faculty</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                <Clock className="h-6 w-6 text-purple-200" />
                <div>
                  <div className="text-xl font-bold">7</div>
                  <div className="text-sm text-purple-200">Time Slots</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                <BarChart3 className="h-6 w-6 text-orange-200" />
                <div>
                  <div className="text-xl font-bold">Full</div>
                  <div className="text-sm text-orange-200">Analytics</div>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Progress Bar (shown when exporting) */}
        {isExporting && (
          <div className="mx-6 mt-4 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-900">Generating PDF...</span>
                  <span className="text-sm font-bold text-blue-700">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Est. {selectedFormat?.estimatedTime || '1-2 min'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-10">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            {/* Format Selection */}
            <div className="xl:col-span-2 space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Label className="text-xl font-bold text-gray-900">Report Format</Label>
                  <p className="text-gray-600 mt-1">Select the type of report you want to generate</p>
                </div>
              </div>
              
              <RadioGroup
                value={options.format}
                onValueChange={(value: string) => setOptions(prev => ({ ...prev, format: value as ExportOptions['format'] }))}
                className="grid grid-cols-1 gap-8"
              >
              {formatOptions.map((format) => {
                const Icon = format.icon
                const isSelected = options.format === format.id
                return (
                  <div key={format.id} className="relative">
                    <RadioGroupItem
                      value={format.id}
                      id={format.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={format.id}
                      className={`
                        block p-8 border-2 rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden min-h-[200px]
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-xl ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`
                            p-3 rounded-xl shrink-0 transition-colors
                            ${isSelected 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            <Icon className="h-7 w-7" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-bold text-lg text-gray-900">{format.name}</span>
                              {format.recommended && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-2 py-1">
                                  <Star className="h-3 w-3 mr-1" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{format.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                              <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {format.pages}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format.estimatedTime}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {format.features.slice(0, 3).map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                                  {feature}
                                </Badge>
                              ))}
                              {format.features.length > 3 && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  +{format.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

            {/* Customization Panel */}
            <div className="xl:col-span-1 space-y-8">
              {/* Content Options */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    Content Options
                  </CardTitle>
                  <CardDescription className="text-base">
                    Choose what to include in your report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="analytics"
                        checked={options.includeAnalytics}
                        onCheckedChange={(checked: boolean) => 
                          setOptions(prev => ({ ...prev, includeAnalytics: checked }))
                        }
                        disabled={options.format === 'analytics'}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer text-gray-900">
                            Analytics & Statistics
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Includes faculty workload analysis, room utilization rates, and scheduling efficiency metrics</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          Faculty workload, room utilization, and performance metrics
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="charts"
                        checked={options.includeCharts}
                        onCheckedChange={(checked: boolean) => 
                          setOptions(prev => ({ ...prev, includeCharts: checked }))
                        }
                        disabled={!options.includeAnalytics}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="charts" className="text-base font-semibold cursor-pointer text-gray-900">
                            Charts & Visualizations
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Adds visual charts like bar graphs, pie charts, and utilization graphs to the report</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          Bar charts, pie charts, and visual data representations
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id="students"
                        checked={options.includeStudentList}
                        onCheckedChange={(checked: boolean) => 
                          setOptions(prev => ({ ...prev, includeStudentList: checked }))
                        }
                        disabled={options.format === 'compact' || options.format === 'grid'}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="students" className="text-base font-semibold cursor-pointer text-gray-900">
                          Student Enrollment Lists
                        </Label>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          Detailed student lists for each course (detailed format only)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Palette className="h-5 w-5 text-purple-600" />
                    </div>
                    Appearance
                  </CardTitle>
                  <CardDescription className="text-base">
                    Customize the visual style of your report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Color Scheme</Label>
                    <RadioGroup
                      value={options.colorScheme}
                      onValueChange={(value: string) => setOptions(prev => ({ ...prev, colorScheme: value as ExportOptions['colorScheme'] }))}
                      className="space-y-4"
                    >
                      {colorSchemes.map((scheme) => (
                        <div key={scheme.id} className="relative">
                          <RadioGroupItem value={scheme.id} id={scheme.id} className="peer sr-only" />
                          <Label
                            htmlFor={scheme.id}
                            className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 peer-checked:border-purple-500 peer-checked:bg-purple-50 transition-all"
                          >
                            <div className={`w-10 h-10 rounded-xl ${scheme.preview} shadow-md`} />
                            <div className="flex-1">
                              <div className="font-semibold text-base text-gray-900">{scheme.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{scheme.bestFor}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="language" className="flex items-center gap-3 text-base font-semibold mb-4">
                      <Globe className="h-5 w-5" />
                      Language
                    </Label>
                    <Select
                      value={options.language}
                      onValueChange={(value: string) => setOptions(prev => ({ ...prev, language: value as ExportOptions['language'] }))}
                    >
                      <SelectTrigger className="w-full h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en" className="text-base py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🇺🇸</span>
                            English
                          </div>
                        </SelectItem>
                        <SelectItem value="es" className="text-base py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🇪🇸</span>
                            Español
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Summary */}
              {selectedFormat && (
                <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="h-5 w-5 text-blue-600" />
                      </div>
                      Export Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <selectedFormat.icon className="h-6 w-6 text-blue-600" />
                        <span className="font-bold text-lg text-gray-900">{selectedFormat.name}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{selectedFormat.pages}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{selectedFormat.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Palette className="h-4 w-4" />
                          <span className="font-medium">{colorSchemes.find(c => c.id === options.colorScheme)?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Globe className="h-4 w-4" />
                          <span className="font-medium">{options.language === 'en' ? 'English' : 'Español'}</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-blue-200">
                        <div className="text-sm text-gray-700 space-y-2">
                          {options.includeAnalytics && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Analytics and statistics included</span>
                            </div>
                          )}
                          {options.includeCharts && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Charts and visualizations included</span>
                            </div>
                          )}
                          {options.includeStudentList && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Student enrollment lists included</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-10 py-8">
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-base text-gray-600">
              <Info className="h-5 w-5" />
              <span>PDF will download automatically when ready</span>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="px-8 py-3 text-base"
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="px-8 py-3 text-base bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-3" />
                    Generate & Download
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}