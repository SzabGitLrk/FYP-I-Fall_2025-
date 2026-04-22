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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimetableDayView } from "@/components/timetable/timetable-day-view";
import { TimetableProgramView } from "@/components/timetable/timetable-program-view";
import { SimpleFilters } from "@/components/timetable/simple-filters";
import { AdvancedFilters } from "@/components/timetable/advanced-filters";
import { ExportOptionsDialog } from "@/components/timetable/export-options-dialog";
import {
  TimetableGridSkeleton,
  StatsSkeleton,
} from "@/components/ui/loading-skeleton";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PreferenceIntegrationInfo } from "@/components/timetable/preference-integration-info";
import { LoadingSpinner } from "@/components/ui/loading-states";
import {
  useTimetableShortcuts,
  useGlobalShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import {
  Calendar,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  BarChart3,
  BookOpen,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toastUtils } from "@/lib/toast-utils";
import { motion } from "framer-motion";

interface Program {
  id: number;
  name: string;
}

interface Semester {
  id: number;
  number: number;
  program: Program;
}

interface Faculty {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  type: string;
  semester: Semester;
  faculty: Faculty;
}

interface Room {
  id: number;
  name: string;
  type: string;
}

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

interface TimetableEntry {
  id: number;
  day: string;
  course: Course;
  room: Room;
  timeslot: TimeSlot;
  faculty: Faculty;
}

export default function TimetablePage() {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(
    []
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filters, setFilters] = useState<{
    programId?: number;
    semesterId?: number;
  }>({});
  const [viewMode, setViewMode] = useState<"daily" | "program">("daily");
  const [activeTab, setActiveTab] = useState<"timetable" | "analytics">(
    "timetable"
  );
  const [preferenceSatisfaction, setPreferenceSatisfaction] = useState<{
    average: number;
    totalViolations: number;
    facultyCount: number;
  } | null>(null);


  // Filter timetable entries based on current filters
  const filteredTimetableEntries = useMemo(() => {
    return timetableEntries.filter((entry) => {
      // Filter by program
      if (filters.programId && entry.course.semester.program.id !== filters.programId) {
        return false;
      }
      
      // Filter by semester
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

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch("/api/rooms");
      const result = await response.json();

      if (result.success) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  }, []);

  const fetchPreferenceSatisfaction = useCallback(async () => {
    try {
      const response = await fetch("/api/preference-analysis");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.overall) {
          setPreferenceSatisfaction({
            average: data.data.overall.averageSatisfaction,
            totalViolations: data.data.overall.totalViolations,
            facultyCount: data.data.overall.facultySatisfaction.length
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch preference satisfaction:", error);
    }
  }, []);

  const handleGenerateTimetable = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/generate-timetable", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toastUtils.timetableGenerated(result.data?.assignmentsCount || 0);
        await Promise.all([fetchTimetable(), fetchPreferenceSatisfaction()]);
      } else {
        toastUtils.error(
          "Generation Failed",
          result.error || "Failed to generate timetable"
        );
      }
    } catch (error) {
      toastUtils.error(
        "Generation Failed",
        "An unexpected error occurred while generating the timetable."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleClearTimetable = async () => {
    setClearing(true);
    try {
      const response = await fetch("/api/timetable", {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toastUtils.timetableCleared();
        setTimetableEntries([]);
      } else {
        toastUtils.error("Clear Failed", "Failed to clear timetable");
      }
    } catch (error) {
      toastUtils.error(
        "Clear Failed",
        "An unexpected error occurred while clearing the timetable."
      );
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTimetable(), fetchTimeSlots(), fetchRooms(), fetchPreferenceSatisfaction()]);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleFilterChange = useCallback(
    (newFilters: { programId?: number; semesterId?: number }) => {
      setFilters(newFilters);
    },
    []
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      if (prev === "daily") return "program";
      return "daily";
    });
  }, []);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (exportOptions: any) => {
    if (filteredTimetableEntries.length === 0) {
      toastUtils.warning(
        "No Data to Export",
        "Please generate a timetable first or adjust your filters."
      );
      return;
    }

    setIsExporting(true);
    try {
      // Use enhanced export functionality
      const { EnhancedPDFExport } = await import("@/lib/enhanced-pdf-export");
      
      await EnhancedPDFExport.exportTimetablePDF(
        filteredTimetableEntries,
        timeSlots,
        filters,
        exportOptions
      );
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

  // Legacy export for keyboard shortcuts
  const handleLegacyExport = useCallback(async () => {
    await handleExport({
      format: 'detailed',
      includeAnalytics: true,
      includeCharts: true,
      colorScheme: 'professional',
      language: 'en'
    });
  }, [handleExport]);

  // Set up keyboard shortcuts
  useGlobalShortcuts();
  const timetableShortcuts = useTimetableShortcuts({
    onGenerate: handleGenerateTimetable,
    onClear: handleClearTimetable,
    onToggleView: toggleViewMode,
    onExport: handleLegacyExport,
  });

  const getUniquePrograms = () => {
    const programs = new Set<string>();
    filteredTimetableEntries.forEach((entry) => {
      programs.add(entry.course.semester.program.name);
    });
    return programs.size;
  };

  const getUniqueCourses = () => {
    const courses = new Set<number>();
    filteredTimetableEntries.forEach((entry) => {
      courses.add(entry.course.id);
    });
    return courses.size;
  };

  const getUniqueRooms = () => {
    const rooms = new Set<number>();
    filteredTimetableEntries.forEach((entry) => {
      rooms.add(entry.room.id);
    });
    return rooms.size;
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading timetable..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="h-10 w-10" />
                <h1 className="text-4xl font-bold">Timetable</h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Generate and manage automated conflict-free timetables across all 7 days
              </p>
            </div>
            <div className="flex items-center gap-3">
              {timetableEntries.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearTimetable}
                  disabled={clearing}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {clearing ? "Clearing..." : "Clear"}
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleGenerateTimetable}
                    disabled={generating}
                    size="lg"
                    className="bg-white text-violet-600 hover:bg-white/90 shadow-lg"
                  >
                    {generating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5 mr-2" />
                    )}
                    {generating ? "Generating..." : "Generate Timetable"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Creates an AI-powered, conflict-free timetable using faculty preferences and room constraints</p>
                </TooltipContent>
              </Tooltip>
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
      {timetableEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="relative overflow-hidden border-2 border-transparent hover:border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p>
                    <p className="text-4xl font-bold">{filteredTimetableEntries.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Across 7 days</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="relative overflow-hidden border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Programs</p>
                    <p className="text-4xl font-bold">{getUniquePrograms()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="relative overflow-hidden border-2 border-transparent hover:border-purple-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Courses</p>
                    <p className="text-4xl font-bold">{getUniqueCourses()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="relative overflow-hidden border-2 border-transparent hover:border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Room Utilization</p>
                    <p className="text-4xl font-bold">
                      {Math.round((getUniqueRooms() / Math.max(1, rooms.length)) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getUniqueRooms()} of {rooms.length} rooms
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="relative overflow-hidden border-2 border-transparent hover:border-emerald-200 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Satisfaction</p>
                    <p className="text-4xl font-bold">
                      {preferenceSatisfaction 
                        ? Math.round(preferenceSatisfaction.average * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preferenceSatisfaction?.facultyCount || 0} faculty
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* View Controls and Actions */}
      {timetableEntries.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
                <TabsList className="grid w-full md:w-auto grid-cols-2">
                  <TabsTrigger value="daily" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Daily View
                  </TabsTrigger>
                  <TabsTrigger value="program" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Program View
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="hidden lg:block">
                  <KeyboardShortcutsHelp shortcuts={timetableShortcuts} />
                </div>
                <ExportOptionsDialog
                  onExport={handleExport}
                  isExporting={isExporting}
                  disabled={filteredTimetableEntries.length === 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="timetable" className="gap-2">
            <Calendar className="h-4 w-4" />
            Timetable
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timetable" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                <span>
                  {viewMode === "daily" ? "Daily" : "Program-wise"} Timetable
                </span>
                {timetableEntries.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {filteredTimetableEntries.length} sessions
                    {filters.programId || filters.semesterId ? ` (filtered)` : ''}
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {timetableEntries.length > 0
                ? `View and filter the generated timetable by program or semester. Switch between daily detailed and program-wise views.`
                : "Generate an automated conflict-free timetable spanning all 7 days of the week"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTimetableEntries.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <SimpleFilters onFilterChange={handleFilterChange} currentFilters={filters} />
                  <AdvancedFilters
                    onFilterChange={handleFilterChange}
                    currentFilters={filters}
                  />
                </div>
                {viewMode === "daily" ? (
                  <TimetableDayView
                    entries={filteredTimetableEntries}
                    timeSlots={timeSlots}
                    rooms={rooms}
                  />
                ) : (
                  <TimetableProgramView
                    entries={filteredTimetableEntries}
                    timeSlots={timeSlots}
                  />
                )}
              </div>
            ) : timetableEntries.length > 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No timetable entries match your current filters. Try adjusting the program or semester selection to see more results.
                </p>
                <div className="flex justify-center space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({})}
                  >
                    Clear Filters
                  </Button>
                  <Button onClick={handleGenerateTimetable} disabled={generating}>
                    {generating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {generating ? "Regenerating..." : "Regenerate Timetable"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  No Timetable Generated
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create programs, semesters, courses, and assign faculty members, then click "Generate Timetable" to create an automated schedule.
                </p>
                <Button onClick={handleGenerateTimetable} disabled={generating} size="lg">
                  {generating ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  {generating ? "Generating..." : "Generate Timetable"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>
              Analyze faculty workload, room utilization, and generate comprehensive reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <PreferenceIntegrationInfo />
              <AnalyticsDashboard
                entries={filteredTimetableEntries}
                timeSlots={timeSlots}
              />
            </div>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
