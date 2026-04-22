import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toastUtils } from "./toast-utils";

interface TimetableEntry {
  id: number;
  day: string;
  course: {
    id: number;
    name: string;
    code: string | null;
    type: string;
    semester: {
      id: number;
      number: number;
      program: {
        id: number;
        name: string;
        department?: {
          id: number;
          name: string;
          code?: string;
        };
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
    minCapacity?: number;
    maxCapacity?: number;
    enhancement?: {
      capacity: number;
      optimalCapacity: number;
    };
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

// Color schemes with proper typing - Updated to match admin/courses page aesthetics
const COLOR_SCHEMES = {
  professional: {
    primary: [16, 185, 129] as [number, number, number], // emerald-500
    secondary: [20, 184, 166] as [number, number, number], // teal-500
    accent: [6, 182, 212] as [number, number, number], // cyan-500
    warning: [249, 115, 22] as [number, number, number], // orange-500
    danger: [239, 68, 68] as [number, number, number], // red-500
    light: [236, 253, 245] as [number, number, number], // emerald-50
    text: [4, 47, 46] as [number, number, number], // teal-950
    blue: [59, 130, 246] as [number, number, number], // blue-500
    purple: [168, 85, 247] as [number, number, number], // purple-500
    indigo: [99, 102, 241] as [number, number, number] // indigo-500
  },
  vibrant: {
    primary: [168, 85, 247] as [number, number, number], // purple-500
    secondary: [236, 72, 153] as [number, number, number], // pink-500
    accent: [20, 184, 166] as [number, number, number], // teal-500
    warning: [251, 191, 36] as [number, number, number], // amber-400
    danger: [239, 68, 68] as [number, number, number], // red-500
    light: [250, 245, 255] as [number, number, number], // purple-50
    text: [88, 28, 135] as [number, number, number], // purple-900
    blue: [59, 130, 246] as [number, number, number], // blue-500
    purple: [168, 85, 247] as [number, number, number], // purple-500
    indigo: [99, 102, 241] as [number, number, number] // indigo-500
  },
  minimal: {
    primary: [71, 85, 105] as [number, number, number], // slate-600
    secondary: [51, 65, 85] as [number, number, number], // slate-700
    accent: [20, 184, 166] as [number, number, number], // teal-500
    warning: [234, 88, 12] as [number, number, number], // orange-600
    danger: [220, 38, 38] as [number, number, number], // red-600
    light: [248, 250, 252] as [number, number, number], // slate-50
    text: [15, 23, 42] as [number, number, number], // slate-900
    blue: [59, 130, 246] as [number, number, number], // blue-500
    purple: [168, 85, 247] as [number, number, number], // purple-500
    indigo: [99, 102, 241] as [number, number, number] // indigo-500
  }
};

export class EnhancedPDFExport {
  private static currentColorScheme = COLOR_SCHEMES.professional;
  private static currentLanguage = 'en';

  // Translations
  private static translations = {
    en: {
      universityTimetable: "UNIVERSITY TIMETABLE",
      professionalReport: "Professional Academic Schedule Report",
      executiveSummary: "Executive Summary",
      dailySchedule: "Daily Schedule",
      analytics: "Analytics & Insights",
      facultyWorkload: "Faculty Workload Analysis",
      roomUtilization: "Room Utilization Analysis",
      generatedOn: "Generated on",
      totalSessions: "Total Sessions",
      studentsEnrolled: "Students Enrolled",
      facultyMembers: "Faculty Members",
      roomsUtilized: "Rooms Utilized",
      course: "Course",
      faculty: "Faculty",
      room: "Room",
      semester: "Semester",
      time: "Time"
    },
    es: {
      universityTimetable: "HORARIO UNIVERSITARIO",
      professionalReport: "Informe Profesional de Horario Académico",
      executiveSummary: "Resumen Ejecutivo",
      dailySchedule: "Horario Diario",
      analytics: "Análisis e Información",
      facultyWorkload: "Análisis de Carga de Trabajo del Profesorado",
      roomUtilization: "Análisis de Utilización de Aulas",
      generatedOn: "Generado el",
      totalSessions: "Sesiones Totales",
      studentsEnrolled: "Estudiantes Inscritos",
      facultyMembers: "Miembros del Profesorado",
      roomsUtilized: "Aulas Utilizadas",
      course: "Curso",
      faculty: "Profesorado",
      room: "Aula",
      semester: "Semestre",
      time: "Hora"
    }
  };

  static setColorScheme(scheme: keyof typeof COLOR_SCHEMES) {
    this.currentColorScheme = COLOR_SCHEMES[scheme];
  }

  static setLanguage(lang: 'en' | 'es') {
    this.currentLanguage = lang;
  }

  private static t(key: string): string {
    return this.translations[this.currentLanguage as keyof typeof this.translations]?.[key as keyof typeof this.translations['en']] || key;
  }

  // Main export function
  static async exportTimetablePDF(
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: { programId?: number; semesterId?: number },
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const defaultOptions: ExportOptions = {
      format: 'detailed',
      includeAnalytics: true,
      includeCharts: true,
      includeStudentList: false,
      colorScheme: 'professional',
      language: 'en'
    };

    const exportOptions = { ...defaultOptions, ...options };
    
    // Set color scheme and language
    this.setColorScheme(exportOptions.colorScheme);
    this.setLanguage(exportOptions.language);

    toastUtils.exportStarted("Enhanced Timetable Report");

    try {
      if (!entries || entries.length === 0) {
        throw new Error("No timetable entries to export");
      }

      const doc = new jsPDF("portrait", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add metadata
      doc.setProperties({
        title: this.generateTitle(entries, filters),
        subject: 'Academic Timetable Report',
        author: 'AI Timetable System',
        creator: 'Enhanced Timetable Generator'
      });

      // Generate content based on format
      switch (exportOptions.format) {
        case 'detailed':
          await this.generateDetailedReport(doc, pageWidth, entries, timeSlots, filters, exportOptions);
          break;
        case 'compact':
          await this.generateCompactReport(doc, pageWidth, entries, timeSlots, filters, exportOptions);
          break;
        case 'grid':
          await this.generateGridReport(doc, pageWidth, entries, timeSlots, filters, exportOptions);
          break;
        case 'analytics':
          await this.generateAnalyticsReport(doc, pageWidth, entries, timeSlots, filters, exportOptions);
          break;
      }

      // Save with enhanced filename
      const filename = this.generateFilename(entries, filters, exportOptions);
      doc.save(filename);

      // Enhanced success message
      const exportMessage = this.generateExportMessage(entries, filters, exportOptions);
      toastUtils.exportCompleted(exportMessage, filename);

    } catch (error) {
      console.error("Enhanced PDF export failed:", error);
      toastUtils.error(
        "Export Failed",
        "An error occurred while generating the enhanced timetable report."
      );
    }
  }

  // Generate detailed report
  private static async generateDetailedReport(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Enhanced cover page
    this.createEnhancedCoverPage(doc, pageWidth, entries, filters, options);

    // Executive summary
    doc.addPage();
    this.createEnhancedExecutiveSummary(doc, pageWidth, entries, timeSlots, options);

    // Daily schedules
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    for (const day of days) {
      const dayEntries = entries.filter(entry => entry.day === day);
      if (dayEntries.length === 0) continue;

      doc.addPage();
      this.createEnhancedDailySchedule(doc, pageWidth, day, dayEntries, options);
    }

    // Analytics if requested
    if (options?.includeAnalytics) {
      doc.addPage();
      this.createAnalyticsSection(doc, pageWidth, entries, options);
    }

    // Student lists if requested
    if (options?.includeStudentList) {
      doc.addPage();
      this.createStudentLists(doc, pageWidth, entries, options);
    }
  }

  // Enhanced cover page - Updated to match admin/courses page gradient design
  private static createEnhancedCoverPage(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Multi-color gradient header (emerald to teal to cyan - matching courses page)
    const gradientHeight = 90;
    const gradientSteps = 30;
    const stepHeight = gradientHeight / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps;
      // Interpolate between emerald (primary), teal (secondary), and cyan (accent)
      let r, g, b;
      if (ratio < 0.5) {
        const localRatio = ratio * 2;
        r = this.currentColorScheme.primary[0] + (this.currentColorScheme.secondary[0] - this.currentColorScheme.primary[0]) * localRatio;
        g = this.currentColorScheme.primary[1] + (this.currentColorScheme.secondary[1] - this.currentColorScheme.primary[1]) * localRatio;
        b = this.currentColorScheme.primary[2] + (this.currentColorScheme.secondary[2] - this.currentColorScheme.primary[2]) * localRatio;
      } else {
        const localRatio = (ratio - 0.5) * 2;
        r = this.currentColorScheme.secondary[0] + (this.currentColorScheme.accent[0] - this.currentColorScheme.secondary[0]) * localRatio;
        g = this.currentColorScheme.secondary[1] + (this.currentColorScheme.accent[1] - this.currentColorScheme.secondary[1]) * localRatio;
        b = this.currentColorScheme.secondary[2] + (this.currentColorScheme.accent[2] - this.currentColorScheme.secondary[2]) * localRatio;
      }
      doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
      doc.rect(0, i * stepHeight, pageWidth, stepHeight, 'F');
    }

    // Title with shadow effect
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    
    const mainTitle = this.generateMainTitle(entries, filters);
    doc.text(mainTitle, pageWidth / 2, 45, { align: "center" });

    // Subtitle
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(240, 253, 250); // emerald-50 tint
    doc.text(this.t('professionalReport'), pageWidth / 2, 65, { align: "center" });

    // Information card with modern styling
    this.createInformationCard(doc, pageWidth, entries, filters, options);

    // Color-coded metrics dashboard (matching courses page stat cards)
    this.createMetricsDashboard(doc, pageWidth, entries);

    // Footer
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(10);
    doc.text(`${this.t('generatedOn')}: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, 280, { align: "center" });
  }

  // Information card - Updated with modern card styling
  private static createInformationCard(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    const cardY = 105;
    const cardHeight = 65;
    
    // Card shadow effect (subtle)
    doc.setFillColor(203, 213, 225); // slate-300
    doc.roundedRect(26, cardY + 1, pageWidth - 50, cardHeight, 10, 10, 'F');
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(25, cardY, pageWidth - 50, cardHeight, 10, 10, 'F');
    
    // Gradient top border (matching courses page card style)
    const borderSteps = 10;
    const borderWidth = (pageWidth - 50) / borderSteps;
    for (let i = 0; i < borderSteps; i++) {
      const ratio = i / borderSteps;
      const r = this.currentColorScheme.primary[0] + (this.currentColorScheme.accent[0] - this.currentColorScheme.primary[0]) * ratio;
      const g = this.currentColorScheme.primary[1] + (this.currentColorScheme.accent[1] - this.currentColorScheme.primary[1]) * ratio;
      const b = this.currentColorScheme.primary[2] + (this.currentColorScheme.accent[2] - this.currentColorScheme.primary[2]) * ratio;
      doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
      doc.rect(25 + (i * borderWidth), cardY, borderWidth, 1.5, 'F');
    }

    // Card content
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Report Overview", 35, cardY + 18);

    const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);
    
    const reportInfo = [
      `${this.t('totalSessions')}: ${entries.length.toLocaleString()}`,
      `${this.t('studentsEnrolled')}: ${totalEnrollment.toLocaleString()}`,
      `${this.t('facultyMembers')}: ${new Set(entries.map(e => e.faculty.name)).size}`,
      `${this.t('roomsUtilized')}: ${new Set(entries.map(e => e.room.name)).size}`
    ];

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    reportInfo.forEach((info, index) => {
      const yPos = cardY + 33 + (index * 9);
      doc.text(info, 35, yPos);
    });
  }

  // Metrics dashboard - Updated to match courses page stat cards with individual gradients
  private static createMetricsDashboard(doc: jsPDF, pageWidth: number, entries: TimetableEntry[]) {
    const dashboardY = 185;
    const metrics = this.calculateMetrics(entries);
    
    // Color-coded metric boxes matching courses page design
    const metricBoxes = [
      { 
        label: "Total Sessions", 
        value: entries.length.toString(), 
        color1: this.currentColorScheme.primary, // emerald
        color2: this.currentColorScheme.secondary, // teal
        icon: "📅"
      },
      { 
        label: "Faculty Members", 
        value: new Set(entries.map(e => e.faculty.name)).size.toString(), 
        color1: [59, 130, 246] as [number, number, number], // blue-500
        color2: [6, 182, 212] as [number, number, number], // cyan-500
        icon: "👥"
      },
      { 
        label: "Utilization", 
        value: `${metrics.avgUtilization}%`, 
        color1: [168, 85, 247] as [number, number, number], // purple-500
        color2: [236, 72, 153] as [number, number, number], // pink-500
        icon: "📊"
      },
      { 
        label: "Quality Score", 
        value: `${metrics.qualityScore}%`, 
        color1: [249, 115, 22] as [number, number, number], // orange-500
        color2: [239, 68, 68] as [number, number, number], // red-500
        icon: "⭐"
      }
    ];

    const boxWidth = (pageWidth - 70) / 4;
    const boxHeight = 40;
    
    metricBoxes.forEach((metric, index) => {
      const x = 25 + (index * (boxWidth + 5));
      
      // Shadow effect
      doc.setFillColor(203, 213, 225); // slate-300
      doc.roundedRect(x + 0.5, dashboardY + 0.5, boxWidth, boxHeight, 8, 8, 'F');
      
      // Gradient box (matching courses page stat cards)
      const gradientSteps = 15;
      const stepWidth = boxWidth / gradientSteps;
      for (let i = 0; i < gradientSteps; i++) {
        const ratio = i / gradientSteps;
        const r = metric.color1[0] + (metric.color2[0] - metric.color1[0]) * ratio;
        const g = metric.color1[1] + (metric.color2[1] - metric.color1[1]) * ratio;
        const b = metric.color1[2] + (metric.color2[2] - metric.color1[2]) * ratio;
        doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
        
        if (i === 0) {
          doc.roundedRect(x + (i * stepWidth), dashboardY, stepWidth + 1, boxHeight, 8, 8, 'F');
        } else if (i === gradientSteps - 1) {
          doc.roundedRect(x + (i * stepWidth), dashboardY, stepWidth, boxHeight, 8, 8, 'F');
        } else {
          doc.rect(x + (i * stepWidth), dashboardY, stepWidth, boxHeight, 'F');
        }
      }
      
      // Value
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(metric.value, x + boxWidth / 2, dashboardY + 20, { align: "center" });
      
      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(metric.label, x + boxWidth / 2, dashboardY + 32, { align: "center" });
    });
  }

  // Enhanced executive summary
  private static createEnhancedExecutiveSummary(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, this.t('executiveSummary'));

    const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);

    // Summary statistics table with updated colors
    const summaryData = [
      [this.t('totalSessions'), entries.length.toString(), "Scheduled across all days"],
      [this.t('studentsEnrolled'), totalEnrollment.toLocaleString(), "Active registrations"],
      ["Academic Programs", new Set(entries.map(e => e.course.semester.program.name)).size.toString(), "Degree programs"],
      [this.t('facultyMembers'), new Set(entries.map(e => e.faculty.name)).size.toString(), "Teaching staff"],
      ["Time Slots", timeSlots.length.toString(), "Daily periods"]
    ];

    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value", "Description"]],
      body: summaryData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.primary, 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 12
      },
      styles: { 
        fontSize: 11, 
        cellPadding: 5,
        textColor: [15, 23, 42] // slate-900
      },
      alternateRowStyles: {
        fillColor: [240, 253, 245] // emerald-50
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 30, fontStyle: 'bold', fillColor: [209, 250, 229] }, // emerald-100
        2: { cellWidth: 80 }
      }
    });
  }

  // Enhanced daily schedule
  private static createEnhancedDailySchedule(
    doc: jsPDF,
    pageWidth: number,
    day: string,
    dayEntries: TimetableEntry[],
    options?: ExportOptions
  ) {
    const dayName = day.charAt(0) + day.slice(1).toLowerCase();
    this.addEnhancedPageHeader(doc, pageWidth, `${dayName} ${this.t('dailySchedule')}`);

    // Day statistics
    const totalStudents = dayEntries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);
    const uniqueRooms = new Set(dayEntries.map(e => e.room.name)).size;
    const uniqueFaculty = new Set(dayEntries.map(e => e.faculty.name)).size;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`${dayEntries.length} sessions | ${totalStudents} students | ${uniqueRooms} rooms | ${uniqueFaculty} faculty`, pageWidth / 2, 50, { align: "center" });

    // Group by time slots
    const entriesByTime = new Map<string, TimetableEntry[]>();
    dayEntries
      .sort((a, b) => a.timeslot.start.localeCompare(b.timeslot.start))
      .forEach(entry => {
        const timeKey = `${entry.timeslot.start}-${entry.timeslot.end}`;
        if (!entriesByTime.has(timeKey)) {
          entriesByTime.set(timeKey, []);
        }
        entriesByTime.get(timeKey)!.push(entry);
      });

    let currentY = 65;

    for (const [timeKey, timeEntries] of entriesByTime) {
      const [startTime, endTime] = timeKey.split('-');
      
      // Time heading with gradient (blue to cyan)
      const timeHeaderSteps = 10;
      const timeHeaderWidth = (pageWidth - 40) / timeHeaderSteps;
      for (let i = 0; i < timeHeaderSteps; i++) {
        const ratio = i / timeHeaderSteps;
        const r = 59 + (6 - 59) * ratio; // blue-500 to cyan-500
        const g = 130 + (182 - 130) * ratio;
        const b = 246 + (212 - 246) * ratio;
        doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
        doc.rect(20 + (i * timeHeaderWidth), currentY, timeHeaderWidth, 12, 'F');
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${this.formatTime(startTime)} - ${this.formatTime(endTime)}`, pageWidth / 2, currentY + 8, { align: "center" });
      
      doc.setTextColor(15, 23, 42); // slate-900
      currentY += 15;

      // Create table for this time slot
      const timeSlotData = timeEntries.map(entry => [
        `${entry.course.name}\n${entry.course.code || 'N/A'}`,
        entry.faculty.name,
        entry.room.name,
        this.formatSemesterShort(entry)
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[this.t('course'), this.t('faculty'), this.t('room'), this.t('semester')]],
        body: timeSlotData,
        theme: 'striped',
        headStyles: { 
          fillColor: this.currentColorScheme.accent, 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 11
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 4,
          valign: 'middle',
          textColor: [15, 23, 42] // slate-900
        },
        alternateRowStyles: {
          fillColor: [240, 253, 245] // emerald-50
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      if (currentY > 250) {
        doc.addPage();
        this.addEnhancedPageHeader(doc, pageWidth, `${dayName} ${this.t('dailySchedule')} (continued)`);
        currentY = 60;
      }
    }
  }

  // Analytics section
  private static createAnalyticsSection(doc: jsPDF, pageWidth: number, entries: TimetableEntry[], options?: ExportOptions) {
    this.addEnhancedPageHeader(doc, pageWidth, this.t('analytics'));

    let currentY = 60;

    // Faculty workload analysis
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(this.t('facultyWorkload'), 20, currentY);
    currentY += 15;

    const facultyWorkload = this.calculateFacultyWorkload(entries);
    const facultyData = facultyWorkload.slice(0, 10).map(faculty => [
      faculty.name.length > 25 ? faculty.name.substring(0, 22) + '...' : faculty.name,
      faculty.sessions.toString(),
      faculty.students.toString(),
      faculty.courses.toString(),
      (faculty.students / faculty.sessions).toFixed(1)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Faculty Member", "Sessions", "Students", "Courses", "Avg Class Size"]],
      body: facultyData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.warning, 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
      }
    });
  }

  // Student lists
  private static createStudentLists(doc: jsPDF, pageWidth: number, entries: TimetableEntry[], options?: ExportOptions) {
    this.addEnhancedPageHeader(doc, pageWidth, "Student Enrollment Lists");

    let currentY = 60;

    // Group by course
    const courseMap = new Map<string, TimetableEntry>();
    entries.forEach(entry => {
      if (!courseMap.has(entry.course.name)) {
        courseMap.set(entry.course.name, entry);
      }
    });

    for (const [courseName, entry] of courseMap) {
      if (currentY > 250) {
        doc.addPage();
        this.addEnhancedPageHeader(doc, pageWidth, "Student Enrollment Lists (continued)");
        currentY = 60;
      }

      // Course header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(courseName, 30, currentY);
      currentY += 10;

      // Student list
      if (entry.course.enrollments && entry.course.enrollments.length > 0) {
        const studentData = entry.course.enrollments.map((enrollment, index) => [
          (index + 1).toString(),
          enrollment.student.regId,
          enrollment.student.regName
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["#", "Registration ID", "Student Name"]],
          body: studentData,
          theme: 'grid',
          headStyles: { 
            fillColor: this.currentColorScheme.secondary,
            textColor: 255,
            fontSize: 10
          },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 80 }
          },
          margin: { left: 30, right: 30 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No students enrolled", 35, currentY);
        currentY += 15;
      }
    }
  }

  // Compact report
  private static async generateCompactReport(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: any,
    options?: ExportOptions
  ) {
    this.createCompactCover(doc, pageWidth, entries, filters, options);
    doc.addPage();
    this.createCompactSummary(doc, pageWidth, entries, timeSlots);
  }

  private static createCompactCover(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    doc.setFillColor(...this.currentColorScheme.primary);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(this.generateMainTitle(entries, filters), pageWidth / 2, 30, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    
    const stats = [
      `Sessions: ${entries.length}`,
      `Faculty: ${new Set(entries.map(e => e.faculty.name)).size}`,
      `Rooms: ${new Set(entries.map(e => e.room.name)).size}`
    ];
    
    stats.forEach((stat, index) => {
      doc.text(stat, pageWidth / 2, 80 + (index * 20), { align: "center" });
    });
  }

  private static createCompactSummary(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[]
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Timetable Summary");
    
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    
    const gridData: string[][] = [];
    const headerRow = ["Time", ...days];
    gridData.push(headerRow);
    
    timeSlots.forEach(slot => {
      const row = [this.formatTime(slot.start)];
      
      days.forEach(day => {
        const dayEntries = entries.filter(e => 
          e.day === day.toUpperCase() + "DAY" && 
          e.timeslot.id === slot.id
        );
        
        if (dayEntries.length > 0) {
          row.push(`${dayEntries.length} sessions`);
        } else {
          row.push("-");
        }
      });
      
      gridData.push(row);
    });
    
    autoTable(doc, {
      startY: 70,
      head: [headerRow],
      body: gridData.slice(1),
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.primary,
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 }
      }
    });
  }

  // Grid report
  private static async generateGridReport(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Use landscape for grid
    doc = new jsPDF('landscape', 'mm', 'a4');
    const landscapeWidth = doc.internal.pageSize.getWidth();
    
    this.addEnhancedPageHeader(doc, landscapeWidth, "Weekly Timetable Grid");
    this.createWeeklyGrid(doc, landscapeWidth, entries, timeSlots);
  }

  private static createWeeklyGrid(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[]
  ) {
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    
    const gridData: string[][] = [];
    
    timeSlots.forEach(slot => {
      const row = [this.formatTime(slot.start)];
      
      days.forEach(day => {
        const dayEntries = entries.filter(e => 
          e.day === day && e.timeslot.id === slot.id
        );
        
        if (dayEntries.length > 0) {
          const cellContent = dayEntries.map(entry => 
            `${entry.course.name}\n${entry.faculty.name}\n${entry.room.name}`
          ).join('\n---\n');
          row.push(cellContent);
        } else {
          row.push("");
        }
      });
      
      gridData.push(row);
    });
    
    autoTable(doc, {
      startY: 60,
      head: [["Time", ...days.map(d => d.substring(0, 3))]],
      body: gridData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.primary,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        valign: 'top'
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          cellWidth: 25,
          halign: 'center'
        }
      }
    });
  }

  // Analytics report
  private static async generateAnalyticsReport(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: any,
    options?: ExportOptions
  ) {
    this.createAnalyticsCover(doc, pageWidth, entries, filters, options);
    doc.addPage();
    this.createAnalyticsSection(doc, pageWidth, entries, options);
    doc.addPage();
    this.createDetailedStatistics(doc, pageWidth, entries);
  }

  private static createAnalyticsCover(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    doc.setFillColor(...this.currentColorScheme.secondary);
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("TIMETABLE ANALYTICS", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Comprehensive Statistical Analysis", pageWidth / 2, 60, { align: "center" });
    
    this.createMetricsDashboard(doc, pageWidth, entries);
  }

  private static createDetailedStatistics(doc: jsPDF, pageWidth: number, entries: TimetableEntry[]) {
    this.addEnhancedPageHeader(doc, pageWidth, "Detailed Statistics");
    
    let currentY = 60;
    
    // Course type distribution
    const courseTypes = new Map<string, number>();
    entries.forEach(entry => {
      courseTypes.set(entry.course.type, (courseTypes.get(entry.course.type) || 0) + 1);
    });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Course Type Distribution", 30, currentY);
    currentY += 15;
    
    const courseTypeData = Array.from(courseTypes.entries()).map(([type, count]) => [
      type,
      count.toString(),
      `${((count / entries.length) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [["Course Type", "Count", "Percentage"]],
      body: courseTypeData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.accent,
        textColor: 255
      },
      styles: { fontSize: 11, cellPadding: 5 },
      margin: { left: 30, right: 30 }
    });
  }

  // Utility functions
  private static formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private static formatSemesterShort(entry: TimetableEntry): string {
    const programName = entry.course.semester.program.name;
    const semesterNumber = entry.course.semester.number;
    
    let programAbbr = '';
    const abbreviationMatch = programName.match(/\(([A-Z]+)\)/);
    if (abbreviationMatch) {
      programAbbr = abbreviationMatch[1];
    } else {
      programAbbr = programName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 4);
    }
    
    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const semesterRoman = romanNumerals[semesterNumber] || `${semesterNumber}`;
    
    return `${programAbbr}-${semesterRoman}`;
  }

  private static calculateMetrics(entries: TimetableEntry[]) {
    const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);
    const avgUtilization = entries.length > 0 ? Math.round((totalEnrollment / entries.length / 50) * 100) : 0;
    
    return {
      qualityScore: Math.min(95, Math.round(avgUtilization + 20)),
      avgUtilization: Math.min(100, avgUtilization),
      efficiency: Math.min(98, Math.round(avgUtilization * 1.2))
    };
  }

  private static calculateFacultyWorkload(entries: TimetableEntry[]) {
    const facultyWorkload = new Map<string, {
      name: string;
      sessions: number;
      students: number;
      courses: Set<string>;
    }>();

    entries.forEach(entry => {
      const facultyName = entry.faculty.name;
      if (!facultyWorkload.has(facultyName)) {
        facultyWorkload.set(facultyName, {
          name: facultyName,
          sessions: 0,
          students: 0,
          courses: new Set()
        });
      }

      const faculty = facultyWorkload.get(facultyName)!;
      faculty.sessions += 1;
      faculty.students += entry.course.enrollments?.length || 0;
      faculty.courses.add(entry.course.name);
    });

    return Array.from(facultyWorkload.values())
      .sort((a, b) => b.sessions - a.sessions)
      .map(faculty => ({
        name: faculty.name,
        sessions: faculty.sessions,
        students: faculty.students,
        courses: faculty.courses.size
      }));
  }

  private static addEnhancedPageHeader(doc: jsPDF, pageWidth: number, title: string) {
    // Gradient header (emerald to teal - matching courses page)
    const headerHeight = 40;
    const gradientSteps = 20;
    const stepWidth = pageWidth / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps;
      const r = this.currentColorScheme.primary[0] + (this.currentColorScheme.secondary[0] - this.currentColorScheme.primary[0]) * ratio;
      const g = this.currentColorScheme.primary[1] + (this.currentColorScheme.secondary[1] - this.currentColorScheme.primary[1]) * ratio;
      const b = this.currentColorScheme.primary[2] + (this.currentColorScheme.secondary[2] - this.currentColorScheme.primary[2]) * ratio;
      doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
      doc.rect(i * stepWidth, 0, stepWidth, headerHeight, 'F');
    }
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 22, { align: "center" });
    
    // Page number
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.text(`Page ${pageNum}`, pageWidth - 20, 28, { align: "right" });
    
    doc.setTextColor(15, 23, 42); // slate-900
  }

  private static generateFilename(
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ): string {
    const date = new Date().toISOString().split('T')[0];
    const format = options?.format || 'detailed';
    
    let filename = `timetable-${format}-${date}`;
    
    if (filters?.programId && entries.length > 0) {
      const program = entries[0].course.semester.program;
      const programCode = program.name.substring(0, 4).toUpperCase();
      filename = `${programCode}-${format}-${date}`;
    }
    
    return `${filename}.pdf`;
  }

  private static generateExportMessage(
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ): string {
    const format = options?.format || 'detailed';
    let message = `Enhanced ${format} timetable report`;
    
    if (filters?.programId && entries.length > 0) {
      const programName = entries[0].course.semester.program.name;
      message = `${programName} ${format} report`;
    }
    
    return message;
  }

  private static generateMainTitle(entries: TimetableEntry[], filters?: any): string {
    if (filters?.programId && entries.length > 0) {
      const program = entries[0].course.semester.program;
      return `${program.name.toUpperCase()} TIMETABLE`;
    }
    
    if (filters?.semesterId && entries.length > 0) {
      const semester = entries[0].course.semester;
      const ordinal = this.getSemesterOrdinal(semester.number);
      return `${semester.program.name.toUpperCase()} - ${ordinal.toUpperCase()} SEMESTER`;
    }
    
    return this.t('universityTimetable');
  }

  private static generateTitle(entries: TimetableEntry[], filters?: any): string {
    if (filters?.programId && entries.length > 0) {
      return `${entries[0].course.semester.program.name} Timetable Report`;
    }
    
    if (filters?.semesterId && entries.length > 0) {
      const semester = entries[0].course.semester;
      return `${semester.program.name} - ${this.getSemesterOrdinal(semester.number)} Semester Timetable`;
    }
    
    return "University Timetable Report";
  }

  private static getSemesterOrdinal(number: number): string {
    if (number === 1) return "1st";
    if (number === 2) return "2nd";
    if (number === 3) return "3rd";
    return `${number}th`;
  }

  // Faculty Workload PDF Export
  static async exportFacultyWorkloadPDF(
    entries: TimetableEntry[],
    filters?: { programId?: number; semesterId?: number; facultyId?: number },
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const defaultOptions: ExportOptions = {
      format: 'detailed',
      includeAnalytics: true,
      includeCharts: true,
      includeStudentList: false,
      colorScheme: 'professional',
      language: 'en'
    };

    const exportOptions = { ...defaultOptions, ...options };
    
    // Set color scheme and language
    this.setColorScheme(exportOptions.colorScheme);
    this.setLanguage(exportOptions.language);

    toastUtils.exportStarted("Faculty Workload Report");

    try {
      if (!entries || entries.length === 0) {
        throw new Error("No timetable entries to analyze");
      }

      const doc = new jsPDF("portrait", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add metadata
      doc.setProperties({
        title: 'Faculty Workload Analysis Report',
        subject: 'Faculty Teaching Load and Distribution Analysis',
        author: 'AI Timetable System',
        creator: 'Enhanced Timetable Generator'
      });

      // Generate faculty workload report
      await this.generateFacultyWorkloadReport(doc, pageWidth, entries, filters, exportOptions);

      // Save with enhanced filename
      const filename = this.generateFacultyWorkloadFilename(filters);
      doc.save(filename);

      // Success message
      toastUtils.exportCompleted("Faculty Workload Report", filename);

    } catch (error) {
      console.error("Faculty workload PDF export failed:", error);
      toastUtils.error(
        "Export Failed",
        "An error occurred while generating the faculty workload report."
      );
    }
  }

  private static async generateFacultyWorkloadReport(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Cover page
    this.createFacultyWorkloadCoverPage(doc, pageWidth, entries, filters, options);

    // Executive summary
    doc.addPage();
    this.createFacultyWorkloadSummary(doc, pageWidth, entries, options);

    // Detailed faculty analysis
    doc.addPage();
    this.createDetailedFacultyAnalysis(doc, pageWidth, entries, options);

    // Workload distribution charts
    doc.addPage();
    this.createWorkloadDistributionCharts(doc, pageWidth, entries, options);

    // Course distribution analysis
    doc.addPage();
    this.createCourseDistributionAnalysis(doc, pageWidth, entries, options);

    // Utilization insights
    doc.addPage();
    this.createUtilizationInsights(doc, pageWidth, entries, options);
  }

  private static createFacultyWorkloadCoverPage(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Gradient header
    doc.setFillColor(...this.currentColorScheme.primary);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    // Accent line
    doc.setFillColor(...this.currentColorScheme.accent);
    doc.rect(0, 77, pageWidth, 3, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("FACULTY WORKLOAD", pageWidth / 2, 35, { align: "center" });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text("ANALYSIS REPORT", pageWidth / 2, 55, { align: "center" });

    // Information card
    this.createFacultyWorkloadInfoCard(doc, pageWidth, entries, filters, options);

    // Key metrics dashboard
    this.createFacultyMetricsDashboard(doc, pageWidth, entries);

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 280, { align: "center" });
  }

  private static createFacultyWorkloadInfoCard(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    const cardY = 100;
    const cardHeight = 70;
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(25, cardY, pageWidth - 50, cardHeight, 8, 8, 'F');
    
    doc.setDrawColor(...this.currentColorScheme.primary);
    doc.setLineWidth(2);
    doc.roundedRect(25, cardY, pageWidth - 50, cardHeight, 8, 8, 'S');

    // Card content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Workload Analysis Overview", 35, cardY + 15);

    const facultyWorkload = this.calculateFacultyWorkload(entries);
    const totalTeachingHours = facultyWorkload.reduce((sum, faculty) => sum + faculty.totalHours, 0);
    const avgWorkload = facultyWorkload.length > 0 ? (totalTeachingHours / facultyWorkload.length).toFixed(1) : '0';
    
    const reportInfo = [
      `Total Faculty Members: ${facultyWorkload.length}`,
      `Total Teaching Hours: ${totalTeachingHours} hours/week`,
      `Average Workload: ${avgWorkload} hours/faculty`,
      `Total Course Assignments: ${entries.length}`
    ];

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    reportInfo.forEach((info, index) => {
      const yPos = cardY + 30 + (index * 8);
      doc.text(info, 35, yPos);
    });
  }

  private static createFacultyMetricsDashboard(doc: jsPDF, pageWidth: number, entries: TimetableEntry[]) {
    const dashboardY = 190;
    const facultyWorkload = this.calculateFacultyWorkload(entries);
    
    // Calculate metrics
    const totalHours = facultyWorkload.reduce((sum, faculty) => sum + faculty.totalHours, 0);
    const avgHours = facultyWorkload.length > 0 ? totalHours / facultyWorkload.length : 0;
    const maxHours = Math.max(...facultyWorkload.map(f => f.totalHours), 0);
    const utilizationRate = maxHours > 0 ? Math.round((avgHours / 40) * 100) : 0; // Assuming 40 hours as full load
    
    const metricBoxes = [
      { 
        label: "Avg Hours/Week", 
        value: `${avgHours.toFixed(1)}h`, 
        color: this.currentColorScheme.accent
      },
      { 
        label: "Max Workload", 
        value: `${maxHours}h`, 
        color: this.currentColorScheme.primary
      },
      { 
        label: "Utilization", 
        value: `${utilizationRate}%`, 
        color: this.currentColorScheme.warning
      }
    ];

    const boxWidth = (pageWidth - 80) / 3;
    metricBoxes.forEach((metric, index) => {
      const x = 30 + (index * (boxWidth + 10));
      
      // Box
      doc.setFillColor(...metric.color);
      doc.roundedRect(x, dashboardY, boxWidth, 35, 5, 5, 'F');
      
      // Value
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(metric.value, x + boxWidth - 10, dashboardY + 18, { align: "right" });
      
      // Label
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(metric.label, x + boxWidth - 10, dashboardY + 28, { align: "right" });
    });
  }

  private static createFacultyWorkloadSummary(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Faculty Workload Summary");

    const facultyWorkload = this.calculateFacultyWorkload(entries);
    
    // Summary statistics
    const totalHours = facultyWorkload.reduce((sum, faculty) => sum + faculty.totalHours, 0);
    const avgHours = facultyWorkload.length > 0 ? totalHours / facultyWorkload.length : 0;
    const maxHours = Math.max(...facultyWorkload.map(f => f.totalHours), 0);
    const minHours = Math.min(...facultyWorkload.map(f => f.totalHours), 0);

    const summaryData = [
      ["Total Faculty Members", facultyWorkload.length.toString(), "Active teaching staff"],
      ["Total Teaching Hours", `${totalHours} hours/week`, "Combined weekly load"],
      ["Average Workload", `${avgHours.toFixed(1)} hours/week`, "Per faculty member"],
      ["Maximum Workload", `${maxHours} hours/week`, "Highest individual load"],
      ["Minimum Workload", `${minHours} hours/week`, "Lowest individual load"],
      ["Load Distribution", this.calculateLoadDistribution(facultyWorkload), "Workload balance"]
    ];

    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value", "Description"]],
      body: summaryData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.primary, 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 12
      },
      styles: { 
        fontSize: 11, 
        cellPadding: 5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 70 }
      }
    });

    // Workload distribution insights
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Insights", 20, currentY);
    currentY += 15;

    const insights = this.generateWorkloadInsights(facultyWorkload);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    insights.forEach((insight, index) => {
      doc.text(`• ${insight}`, 25, currentY + (index * 8));
    });
  }

  private static createDetailedFacultyAnalysis(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Detailed Faculty Analysis");

    const facultyWorkload = this.calculateFacultyWorkload(entries);
    
    // Sort by total hours descending
    facultyWorkload.sort((a, b) => b.totalHours - a.totalHours);

    const facultyData = facultyWorkload.map(faculty => [
      faculty.name.length > 30 ? faculty.name.substring(0, 27) + '...' : faculty.name,
      faculty.sessions.toString(),
      `${faculty.totalHours}h`,
      faculty.students.toString(),
      faculty.courses.toString(),
      faculty.avgClassSize.toFixed(1),
      this.getWorkloadCategory(faculty.totalHours)
    ]);

    autoTable(doc, {
      startY: 60,
      head: [["Faculty Member", "Sessions", "Hours", "Students", "Courses", "Avg Size", "Category"]],
      body: facultyData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.warning, 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }
      }
    });
  }

  private static createWorkloadDistributionCharts(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Workload Distribution Analysis");

    const facultyWorkload = this.calculateFacultyWorkload(entries);
    
    // Create workload distribution chart using simple graphics
    let currentY = 70;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Teaching Hours Distribution", 30, currentY);
    currentY += 20;

    // Create histogram-style chart
    const workloadRanges = this.categorizeWorkloads(facultyWorkload);
    const maxCount = Math.max(...Object.values(workloadRanges));
    const chartWidth = pageWidth - 80;
    const chartHeight = 80;
    const barWidth = chartWidth / Object.keys(workloadRanges).length;

    // Draw chart background
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.rect(40, currentY, chartWidth, chartHeight, 'S');

    // Draw bars
    Object.entries(workloadRanges).forEach(([range, count], index) => {
      const barHeight = (count / maxCount) * (chartHeight - 10);
      const x = 40 + (index * barWidth) + 5;
      const y = currentY + chartHeight - barHeight - 5;
      
      doc.setFillColor(...this.currentColorScheme.accent);
      doc.rect(x, y, barWidth - 10, barHeight, 'F');
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(range, x + (barWidth - 10) / 2, currentY + chartHeight + 10, { align: "center" });
      doc.text(count.toString(), x + (barWidth - 10) / 2, y - 5, { align: "center" });
    });

    currentY += chartHeight + 30;

    // Course type distribution
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Course Type Distribution by Faculty", 30, currentY);
    currentY += 15;

    const courseTypeData = this.calculateCourseTypeDistribution(entries);
    
    autoTable(doc, {
      startY: currentY,
      head: [["Course Type", "Faculty Count", "Total Sessions", "Avg per Faculty"]],
      body: courseTypeData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.secondary,
        textColor: 255,
        fontSize: 11
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 35 }
      }
    });
  }

  private static createCourseDistributionAnalysis(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Course Distribution Analysis");

    let currentY = 60;

    // Program-wise faculty distribution
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Faculty Distribution by Program", 30, currentY);
    currentY += 15;

    const programDistribution = this.calculateProgramDistribution(entries);
    
    autoTable(doc, {
      startY: currentY,
      head: [["Program", "Faculty Count", "Sessions", "Students", "Avg Load"]],
      body: programDistribution,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.accent,
        textColor: 255,
        fontSize: 11
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 30 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Time distribution analysis
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Teaching Time Distribution", 30, currentY);
    currentY += 15;

    const timeDistribution = this.calculateTimeDistribution(entries);
    
    autoTable(doc, {
      startY: currentY,
      head: [["Time Slot", "Faculty Count", "Sessions", "Utilization %"]],
      body: timeDistribution,
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.primary,
        textColor: 255,
        fontSize: 11
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 35 }
      }
    });
  }

  private static createUtilizationInsights(
    doc: jsPDF,
    pageWidth: number,
    entries: TimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Utilization Insights & Recommendations");

    let currentY = 60;

    // Workload balance analysis
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Workload Balance Analysis", 30, currentY);
    currentY += 15;

    const facultyWorkload = this.calculateFacultyWorkload(entries);
    const balanceAnalysis = this.analyzeWorkloadBalance(facultyWorkload);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    balanceAnalysis.forEach((analysis, index) => {
      doc.text(`• ${analysis}`, 35, currentY + (index * 8));
    });

    currentY += balanceAnalysis.length * 8 + 20;

    // Recommendations
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Optimization Recommendations", 30, currentY);
    currentY += 15;

    const recommendations = this.generateWorkloadRecommendations(facultyWorkload, entries);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    recommendations.forEach((recommendation, index) => {
      const lines = doc.splitTextToSize(`• ${recommendation}`, pageWidth - 70);
      lines.forEach((line: string, lineIndex: number) => {
        doc.text(line, 35, currentY + (index * 16) + (lineIndex * 6));
      });
    });
  }

  // Helper methods for faculty workload calculations
  private static calculateFacultyWorkload(entries: TimetableEntry[]) {
    const facultyWorkload = new Map<string, {
      name: string;
      sessions: number;
      students: number;
      courses: Set<string>;
      totalHours: number;
      avgClassSize: number;
    }>();

    entries.forEach(entry => {
      const facultyName = entry.faculty.name;
      if (!facultyWorkload.has(facultyName)) {
        facultyWorkload.set(facultyName, {
          name: facultyName,
          sessions: 0,
          students: 0,
          courses: new Set(),
          totalHours: 0,
          avgClassSize: 0
        });
      }

      const faculty = facultyWorkload.get(facultyName)!;
      faculty.sessions += 1;
      faculty.students += entry.course.enrollments?.length || 0;
      faculty.courses.add(entry.course.name);
      
      // Calculate hours based on time slot duration
      const startTime = entry.timeslot.start;
      const endTime = entry.timeslot.end;
      const duration = this.calculateDuration(startTime, endTime);
      faculty.totalHours += duration;
    });

    return Array.from(facultyWorkload.values())
      .map(faculty => ({
        ...faculty,
        courses: faculty.courses.size,
        avgClassSize: faculty.sessions > 0 ? faculty.students / faculty.sessions : 0
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }

  private static calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) / 60; // Return hours
  }

  private static calculateLoadDistribution(facultyWorkload: any[]): string {
    const totalFaculty = facultyWorkload.length;
    if (totalFaculty === 0) return "No data";
    
    const avgHours = facultyWorkload.reduce((sum, f) => sum + f.totalHours, 0) / totalFaculty;
    const variance = facultyWorkload.reduce((sum, f) => sum + Math.pow(f.totalHours - avgHours, 2), 0) / totalFaculty;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 2) return "Well balanced";
    if (stdDev < 4) return "Moderately balanced";
    return "Needs balancing";
  }

  private static generateWorkloadInsights(facultyWorkload: any[]): string[] {
    const insights: string[] = [];
    
    if (facultyWorkload.length === 0) {
      insights.push("No faculty workload data available for analysis.");
      return insights;
    }

    const totalHours = facultyWorkload.reduce((sum, f) => sum + f.totalHours, 0);
    const avgHours = totalHours / facultyWorkload.length;
    const maxHours = Math.max(...facultyWorkload.map(f => f.totalHours));
    const minHours = Math.min(...facultyWorkload.map(f => f.totalHours));
    
    insights.push(`Average teaching load is ${avgHours.toFixed(1)} hours per week per faculty member.`);
    
    if (maxHours - minHours > 8) {
      insights.push(`Significant workload imbalance detected (${maxHours - minHours} hour difference).`);
    }
    
    const overloaded = facultyWorkload.filter(f => f.totalHours > 25).length;
    if (overloaded > 0) {
      insights.push(`${overloaded} faculty member(s) have heavy workloads (>25 hours/week).`);
    }
    
    const underutilized = facultyWorkload.filter(f => f.totalHours < 10).length;
    if (underutilized > 0) {
      insights.push(`${underutilized} faculty member(s) have light workloads (<10 hours/week).`);
    }

    return insights;
  }

  private static getWorkloadCategory(hours: number): string {
    if (hours < 10) return "Light";
    if (hours < 20) return "Moderate";
    if (hours < 30) return "Heavy";
    return "Overloaded";
  }

  private static categorizeWorkloads(facultyWorkload: any[]): Record<string, number> {
    const ranges = {
      "0-10h": 0,
      "11-20h": 0,
      "21-30h": 0,
      "31+h": 0
    };

    facultyWorkload.forEach(faculty => {
      if (faculty.totalHours <= 10) ranges["0-10h"]++;
      else if (faculty.totalHours <= 20) ranges["11-20h"]++;
      else if (faculty.totalHours <= 30) ranges["21-30h"]++;
      else ranges["31+h"]++;
    });

    return ranges;
  }

  private static calculateCourseTypeDistribution(entries: TimetableEntry[]): string[][] {
    const courseTypes = new Map<string, {
      facultySet: Set<string>;
      sessions: number;
    }>();

    entries.forEach(entry => {
      const type = entry.course.type;
      if (!courseTypes.has(type)) {
        courseTypes.set(type, {
          facultySet: new Set(),
          sessions: 0
        });
      }
      
      const typeData = courseTypes.get(type)!;
      typeData.facultySet.add(entry.faculty.name);
      typeData.sessions++;
    });

    return Array.from(courseTypes.entries()).map(([type, data]) => [
      type,
      data.facultySet.size.toString(),
      data.sessions.toString(),
      (data.sessions / data.facultySet.size).toFixed(1)
    ]);
  }

  private static calculateProgramDistribution(entries: TimetableEntry[]): string[][] {
    const programs = new Map<string, {
      facultySet: Set<string>;
      sessions: number;
      students: number;
    }>();

    entries.forEach(entry => {
      const programName = entry.course.semester.program.name;
      if (!programs.has(programName)) {
        programs.set(programName, {
          facultySet: new Set(),
          sessions: 0,
          students: 0
        });
      }
      
      const programData = programs.get(programName)!;
      programData.facultySet.add(entry.faculty.name);
      programData.sessions++;
      programData.students += entry.course.enrollments?.length || 0;
    });

    return Array.from(programs.entries()).map(([program, data]) => [
      program.length > 25 ? program.substring(0, 22) + '...' : program,
      data.facultySet.size.toString(),
      data.sessions.toString(),
      data.students.toString(),
      (data.sessions / data.facultySet.size).toFixed(1)
    ]);
  }

  private static calculateTimeDistribution(entries: TimetableEntry[]): string[][] {
    const timeSlots = new Map<string, {
      facultySet: Set<string>;
      sessions: number;
    }>();

    entries.forEach(entry => {
      const timeKey = `${entry.timeslot.start}-${entry.timeslot.end}`;
      if (!timeSlots.has(timeKey)) {
        timeSlots.set(timeKey, {
          facultySet: new Set(),
          sessions: 0
        });
      }
      
      const timeData = timeSlots.get(timeKey)!;
      timeData.facultySet.add(entry.faculty.name);
      timeData.sessions++;
    });

    const totalSessions = entries.length;
    
    return Array.from(timeSlots.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timeSlot, data]) => [
        this.formatTimeSlot(timeSlot),
        data.facultySet.size.toString(),
        data.sessions.toString(),
        `${((data.sessions / totalSessions) * 100).toFixed(1)}%`
      ]);
  }

  private static formatTimeSlot(timeSlot: string): string {
    const [start, end] = timeSlot.split('-');
    return `${this.formatTime(start)} - ${this.formatTime(end)}`;
  }

  private static analyzeWorkloadBalance(facultyWorkload: any[]): string[] {
    const analysis: string[] = [];
    
    if (facultyWorkload.length === 0) return ["No faculty data available for balance analysis."];
    
    const avgHours = facultyWorkload.reduce((sum, f) => sum + f.totalHours, 0) / facultyWorkload.length;
    const maxHours = Math.max(...facultyWorkload.map(f => f.totalHours));
    const minHours = Math.min(...facultyWorkload.map(f => f.totalHours));
    
    const balanceRatio = minHours > 0 ? maxHours / minHours : maxHours;
    
    if (balanceRatio < 1.5) {
      analysis.push("Excellent workload balance across all faculty members.");
    } else if (balanceRatio < 2.0) {
      analysis.push("Good workload balance with minor variations.");
    } else if (balanceRatio < 3.0) {
      analysis.push("Moderate workload imbalance that could benefit from redistribution.");
    } else {
      analysis.push("Significant workload imbalance requiring immediate attention.");
    }
    
    const overloaded = facultyWorkload.filter(f => f.totalHours > avgHours * 1.5).length;
    const underutilized = facultyWorkload.filter(f => f.totalHours < avgHours * 0.5).length;
    
    if (overloaded > 0) {
      analysis.push(`${overloaded} faculty member(s) are significantly overloaded (>150% of average).`);
    }
    
    if (underutilized > 0) {
      analysis.push(`${underutilized} faculty member(s) are underutilized (<50% of average).`);
    }

    return analysis;
  }

  private static generateWorkloadRecommendations(facultyWorkload: any[], entries: TimetableEntry[]): string[] {
    const recommendations: string[] = [];
    
    if (facultyWorkload.length === 0) return ["No data available for recommendations."];
    
    const avgHours = facultyWorkload.reduce((sum, f) => sum + f.totalHours, 0) / facultyWorkload.length;
    const overloaded = facultyWorkload.filter(f => f.totalHours > avgHours * 1.5);
    const underutilized = facultyWorkload.filter(f => f.totalHours < avgHours * 0.5);
    
    if (overloaded.length > 0 && underutilized.length > 0) {
      recommendations.push("Consider redistributing courses from overloaded faculty to underutilized faculty to achieve better balance.");
    }
    
    if (overloaded.length > 0) {
      recommendations.push(`Review course assignments for ${overloaded.map(f => f.name).join(', ')} to prevent burnout and maintain teaching quality.`);
    }
    
    if (underutilized.length > 0) {
      recommendations.push(`Consider assigning additional courses or responsibilities to ${underutilized.map(f => f.name).join(', ')} to optimize resource utilization.`);
    }
    
    // Check for course type specialization
    const theoryHeavy = facultyWorkload.filter(f => {
      const facultyEntries = entries.filter(e => e.faculty.name === f.name);
      const theoryCount = facultyEntries.filter(e => e.course.type === 'THEORY').length;
      return theoryCount / facultyEntries.length > 0.8;
    });
    
    if (theoryHeavy.length > 0) {
      recommendations.push("Consider diversifying course types for faculty members who are heavily assigned to theory courses to provide variety.");
    }
    
    recommendations.push("Implement regular workload monitoring to maintain optimal distribution and faculty satisfaction.");
    
    return recommendations;
  }

  private static generateFacultyWorkloadFilename(filters?: any): string {
    const date = new Date().toISOString().split('T')[0];
    let filename = `faculty-workload-report-${date}`;
    
    if (filters?.facultyId) {
      filename = `faculty-${filters.facultyId}-workload-${date}`;
    } else if (filters?.programId) {
      filename = `program-${filters.programId}-faculty-workload-${date}`;
    }
    
    return `${filename}.pdf`;
  }
}