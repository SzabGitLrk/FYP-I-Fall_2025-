"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  Download,
  FileText,
  BarChart3,
  Grid3X3,
  Zap,
  Clock,
  Users,
  Calendar,
  Palette,
  Globe,
  Info,
  CheckCircle2,
  Star,
  Eye,
  AlertCircle
} from "lucide-react";
import { toastUtils } from "@/lib/toast-utils";

interface TimetableEntry {
  id: number;
  day: string;
  course: {
    id: number;
    name: string;
    code: string;
    type: string;
    semester: {
      id: number;
      number: number;
      program: {
        id: number;
        name: string;
      };
    };
    enrollments?: Array<{
      id: number;
      student: {
        id: number;
        regId: string;
        regName: string;
      };
    }>;
  };
  faculty: {
    id: number;
    name: string;
  };
  room: {
    id: number;
    name: string;
    type: string;
  };
  timeslot: {
    id: number;
    start: string;
    end: string;
  };
}

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

interface ExportOptions {
  format: 'detailed' | 'compact' | 'grid' | 'analytics';
  includeAnalytics: boolean;
  includeCharts: boolean;
  includeStudentList: boolean;
  colorScheme: 'professional' | 'vibrant' | 'minimal';
  language: 'en' | 'es';
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
];

const colorSchemes = [
  {
    id: 'professional',
    name: 'Professional Emerald',
    description: 'Modern emerald-teal gradient matching admin interface',
    preview: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    colors: ['#10B981', '#14B8A6', '#06B6D4'],
    bestFor: 'Official documents, presentations, reports'
  },
  {
    id: 'vibrant',
    name: 'Vibrant Colors',
    description: 'Colorful theme with purple and pink accents',
    preview: 'bg-gradient-to-r from-purple-500 to-pink-500',
    colors: ['#A855F7', '#EC4899', '#14B8A6'],
    bestFor: 'Creative reports, student materials'
  },
  {
    id: 'minimal',
    name: 'Minimal Slate',
    description: 'Clean minimal design with slate tones',
    preview: 'bg-gradient-to-r from-slate-600 to-slate-700',
    colors: ['#475569', '#334155', '#14B8A6'],
    bestFor: 'Academic papers, formal reports'
  }
];

export default function ExportPage() {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [filters] = useState<{
    programId?: number;
    semesterId?: number;
  }>({});
  const [options, setOptions] = useState<ExportOptions>({
    format: 'detailed',
    includeAnalytics: true,
    includeCharts: true,
    includeStudentList: false,
    colorScheme: 'professional',
    language: 'en'
  });

  // Filter timetable entries based on current filters
  const filteredTimetableEntries = useMemo(() => {
    return timetableEntries.filter((entry) => {
      if (filters.programId && entry.course.semester.program.id !== filters.programId) {
        return false;
      }
      if (filters.semesterId && entry.course.semester.id !== filters.semesterId) {
        return false;
      }
      return true;
    });
  }, [timetableEntries, filters]);

  const fetchTimetable = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.programId)
        params.append("programId", filters.programId.toString());
      if (filters.semesterId)
        params.append("semesterId", filters.semesterId.toString());

      const response = await fetch(`/api/timetable?${params}`);
      const result = await response.json();

      if (result.success) {
        setTimetableEntries(result.data);
      } else {
        toastUtils.error(
          "Failed to fetch timetable",
          "Please check your connection and try again."
        );
      }
    } catch (error) {
      toastUtils.error(
        "Failed to fetch timetable",
        "Please check your connection and try again."
      );
    }
  }, [filters.programId, filters.semesterId]);

  const fetchTimeSlots = useCallback(async () => {
    try {
      const response = await fetch("/api/timeslots");
      const result = await response.json();

      if (result.success) {
        setTimeSlots(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch time slots:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTimetable(), fetchTimeSlots()]);
      setLoading(false);
    };

    loadData();
  }, [fetchTimetable, fetchTimeSlots]);



  const handleExport = useCallback(async (exportOptions: ExportOptions) => {
    if (filteredTimetableEntries.length === 0) {
      toastUtils.warning(
        "No Data to Export",
        "Please generate a timetable first or adjust your filters."
      );
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Use enhanced export functionality
      const { EnhancedPDFExport } = await import("@/lib/enhanced-pdf-export");
      
      await EnhancedPDFExport.exportTimetablePDF(
        filteredTimetableEntries,
        timeSlots,
        filters,
        exportOptions
      );
      
      setExportProgress(100);
      setTimeout(() => {
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Enhanced export failed, falling back to legacy:", error);
      
      // Fallback to legacy export if enhanced fails
      try {
        const { ExportUtils } = await import("@/lib/export-utils");
        await ExportUtils.exportDetailedTimetablePDF(
          filteredTimetableEntries,
          timeSlots,
          filters,
          exportOptions
        );
      } catch (fallbackError) {
        console.error("Legacy export also failed:", fallbackError);
        toastUtils.error(
          "Export Failed",
          "An error occurred while exporting the timetable."
        );
      }
    } finally {
      setIsExporting(false);
    }
  }, [filteredTimetableEntries, timeSlots, filters]);

  const handleFacultyWorkloadExport = useCallback(async () => {
    if (filteredTimetableEntries.length === 0) {
      toastUtils.warning(
        "No Data to Export",
        "Please generate a timetable first or adjust your filters."
      );
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Use enhanced export functionality for faculty workload
      const { EnhancedPDFExport } = await import("@/lib/enhanced-pdf-export");
      
      await EnhancedPDFExport.exportFacultyWorkloadPDF(
        filteredTimetableEntries,
        filters,
        {
          format: 'detailed',
          includeAnalytics: true,
          includeCharts: true,
          includeStudentList: false,
          colorScheme: options.colorScheme,
          language: options.language
        }
      );
      
      setExportProgress(100);
      setTimeout(() => {
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Faculty workload export failed:", error);
      toastUtils.error(
        "Export Failed",
        "An error occurred while generating the faculty workload report."
      );
    } finally {
      setIsExporting(false);
    }
  }, [filteredTimetableEntries, filters, options.colorScheme, options.language]);

  const selectedFormat = formatOptions.find(f => f.id === options.format);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Export</h1>
            <p className="text-gray-600">
              Generate professional timetable reports
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              Loading export options...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Download className="h-8 w-8" />
              </div>
              PDF Export Center
            </h1>
            <p className="text-blue-100 text-lg mt-2">
              Create professional timetable reports with customizable formats and styling
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport({
                format: 'detailed',
                includeAnalytics: true,
                includeCharts: true,
                includeStudentList: false,
                colorScheme: 'professional',
                language: 'en'
              })}
              disabled={isExporting || filteredTimetableEntries.length === 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Export
            </Button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
            <Calendar className="h-6 w-6 text-blue-200" />
            <div>
              <div className="text-xl font-bold">{filteredTimetableEntries.length}</div>
              <div className="text-sm text-blue-200">Sessions</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
            <Users className="h-6 w-6 text-green-200" />
            <div>
              <div className="text-xl font-bold">{new Set(filteredTimetableEntries.map(e => e.faculty.name)).size}</div>
              <div className="text-sm text-green-200">Faculty</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
            <Clock className="h-6 w-6 text-purple-200" />
            <div>
              <div className="text-xl font-bold">{timeSlots.length}</div>
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
      </div>

      {/* Progress Bar (shown when exporting) */}
      {isExporting && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-blue-900">Generating PDF...</span>
                  <span className="text-lg font-bold text-blue-700">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-3" />
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="h-6 w-6" />
                <span className="text-sm font-medium">Est. {selectedFormat?.estimatedTime || '1-2 min'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Main Export Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Format Selection */}
        <div className="xl:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                Report Format
              </CardTitle>
              <CardDescription className="text-base">
                Select the type of report you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={options.format}
                onValueChange={(value: string) => setOptions(prev => ({ ...prev, format: value as ExportOptions['format'] }))}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  const isSelected = options.format === format.id;
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
                          block p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 min-h-[180px]
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
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Options Panel */}
        <div className="space-y-6">
          {/* Content Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                Content Options
              </CardTitle>
              <CardDescription>
                Choose what to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
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
                    <Label htmlFor="analytics" className="text-base font-semibold cursor-pointer text-gray-900">
                      Analytics & Statistics
                    </Label>
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
                    <Label htmlFor="charts" className="text-base font-semibold cursor-pointer text-gray-900">
                      Charts & Visualizations
                    </Label>
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

          {/* Appearance Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the visual style of your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">Color Scheme</Label>
                <RadioGroup
                  value={options.colorScheme}
                  onValueChange={(value: string) => setOptions(prev => ({ ...prev, colorScheme: value as ExportOptions['colorScheme'] }))}
                  className="space-y-3"
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
            <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
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

      {/* Faculty Workload Reports */}
      <Card className="border-orange-200 bg-linear-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            Faculty Workload Reports
          </CardTitle>
          <CardDescription className="text-base">
            Generate detailed analysis of faculty teaching loads, course distribution, and utilization metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Faculty Workload Features */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Report Features
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Teaching hours per faculty member</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Course distribution analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Workload balance insights</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Visual charts and graphs</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Optimization recommendations</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Current Data
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(filteredTimetableEntries.map(e => e.faculty.name)).size}
                  </div>
                  <div className="text-sm text-gray-600">Faculty Members</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredTimetableEntries.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(filteredTimetableEntries.map(e => e.course.name)).size}
                  </div>
                  <div className="text-sm text-gray-600">Unique Courses</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredTimetableEntries.reduce((sum, e) => sum + (e.course.enrollments?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-600">
              <Info className="h-5 w-5" />
              <span className="text-base">Faculty workload report will include detailed analytics and recommendations</span>
            </div>
            <Button 
              onClick={() => handleFacultyWorkloadExport()} 
              disabled={isExporting || filteredTimetableEntries.length === 0}
              size="lg"
              className="px-8 py-3 text-base bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 mr-3" />
                  Generate Faculty Workload Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-600">
              <Info className="h-5 w-5" />
              <span className="text-base">PDF will download automatically when ready</span>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => handleExport(options)} 
                disabled={isExporting || filteredTimetableEntries.length === 0}
                size="lg"
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
                    Generate & Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Data State */}
      {timetableEntries.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Timetable Data Available
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Generate a timetable first before you can export PDF reports. 
                Go to the Timetable page to create your schedule.
              </p>
              <Button asChild>
                <a href="/admin/timetable">
                  <Calendar className="h-4 w-4 mr-2" />
                  Go to Timetable
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}