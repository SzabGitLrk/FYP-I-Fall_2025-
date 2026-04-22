import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toastUtils } from "./toast-utils";

// Enhanced interfaces with better typing
interface EnhancedTimetableEntry {
  id: number;
  day: string;
  course: {
    id: number;
    name: string;
    code: string | null;
    type: 'THEORY' | 'LAB';
    semester: {
      id: number;
      number: number;
      program: {
        id: number;
        name: string;
        code?: string;
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
      isActive: boolean;
    }>;
  };
  faculty: {
    id: number;
    name: string;
    designation?: string;
    email?: string;
  };
  room: {
    id: number;
    name: string;
    type: 'CLASSROOM' | 'LAB';
    minCapacity?: number;
    maxCapacity?: number;
    enhancement?: {
      capacity: number;
      optimalCapacity: number;
      equipment?: string[];
    };
  };
  timeslot: {
    id: number;
    start: string;
    end: string;
  };
}

interface ExportOptions {
  format: 'detailed' | 'compact' | 'grid' | 'analytics';
  includeAnalytics: boolean;
  includeCharts: boolean;
  includeStudentList: boolean;
  colorScheme: 'professional' | 'vibrant' | 'minimal';
  pageOrientation: 'portrait' | 'landscape';
  language: 'en' | 'es' | 'fr';
  customLogo?: string;
  institutionName?: string;
  watermark?: string;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

// Enhanced color schemes
const COLOR_SCHEMES = {
  professional: {
    primary: [41, 128, 185],
    secondary: [52, 73, 94],
    accent: [46, 204, 113],
    warning: [230, 126, 34],
    danger: [231, 76, 60],
    light: [236, 240, 241],
    text: [44, 62, 80]
  },
  vibrant: {
    primary: [155, 89, 182],
    secondary: [52, 152, 219],
    accent: [26, 188, 156],
    warning: [241, 196, 15],
    danger: [231, 76, 60],
    light: [245, 245, 245],
    text: [44, 62, 80]
  },
  minimal: {
    primary: [95, 106, 106],
    secondary: [44, 62, 80],
    accent: [22, 160, 133],
    warning: [211, 84, 0],
    danger: [192, 57, 43],
    light: [250, 250, 250],
    text: [33, 37, 41]
  }
};

export class EnhancedExportUtils {
  private static currentColorScheme = COLOR_SCHEMES.professional;
  private static currentLanguage = 'en';
  
  // Internationalization
  private static translations = {
    en: {
      universityTimetable: "UNIVERSITY TIMETABLE",
      professionalReport: "Professional Academic Schedule Report",
      executiveSummary: "Executive Summary",
      dailySchedule: "Daily Schedule",
      analytics: "Analytics & Insights",
      facultyWorkload: "Faculty Workload Analysis",
      roomUtilization: "Room Utilization Analysis",
      capacityAnalysis: "Capacity Analysis",
      generatedOn: "Generated on",
      totalSessions: "Total Sessions",
      studentsEnrolled: "Students Enrolled",
      facultyMembers: "Faculty Members",
      roomsUtilized: "Rooms Utilized",
      avgClassSize: "Average Class Size",
      course: "Course",
      faculty: "Faculty",
      room: "Room",
      semester: "Semester",
      time: "Time",
      capacity: "Capacity",
      utilization: "Utilization",
      sessions: "Sessions",
      students: "Students",
      efficiency: "Efficiency"
    },
    es: {
      universityTimetable: "HORARIO UNIVERSITARIO",
      professionalReport: "Informe Profesional de Horario Académico",
      executiveSummary: "Resumen Ejecutivo",
      dailySchedule: "Horario Diario",
      analytics: "Análisis e Información",
      facultyWorkload: "Análisis de Carga de Trabajo del Profesorado",
      roomUtilization: "Análisis de Utilización de Aulas",
      capacityAnalysis: "Análisis de Capacidad",
      generatedOn: "Generado el",
      totalSessions: "Sesiones Totales",
      studentsEnrolled: "Estudiantes Inscritos",
      facultyMembers: "Miembros del Profesorado",
      roomsUtilized: "Aulas Utilizadas",
      avgClassSize: "Tamaño Promedio de Clase",
      course: "Curso",
      faculty: "Profesorado",
      room: "Aula",
      semester: "Semestre",
      time: "Hora",
      capacity: "Capacidad",
      utilization: "Utilización",
      sessions: "Sesiones",
      students: "Estudiantes",
      efficiency: "Eficiencia"
    }
  };

  static setLanguage(lang: 'en' | 'es' | 'fr') {
    this.currentLanguage = lang;
  }

  static setColorScheme(scheme: keyof typeof COLOR_SCHEMES) {
    this.currentColorScheme = COLOR_SCHEMES[scheme];
  }

  private static t(key: string): string {
    return this.translations[this.currentLanguage as keyof typeof this.translations]?.[key as keyof typeof this.translations['en']] || key;
  }

  // Enhanced PDF export with multiple format options
  static async exportTimetablePDF(
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    filters?: { programId?: number; semesterId?: number },
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const defaultOptions: ExportOptions = {
      format: 'detailed',
      includeAnalytics: true,
      includeCharts: true,
      includeStudentList: false,
      colorScheme: 'professional',
      pageOrientation: 'portrait',
      language: 'en',
      institutionName: 'University Academic System'
    };

    const exportOptions = { ...defaultOptions, ...options };
    
    // Set color scheme and language
    this.setColorScheme(exportOptions.colorScheme);
    this.setLanguage(exportOptions.language);

    toastUtils.exportStarted("Enhanced Timetable Report");

    try {
      // Validate input data
      if (!entries || entries.length === 0) {
        throw new Error("No timetable entries to export");
      }

      const doc = new jsPDF(exportOptions.pageOrientation, "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Add metadata
      doc.setProperties({
        title: this.generateTitle(entries, filters),
        subject: 'Academic Timetable Report',
        author: exportOptions.institutionName,
        creator: 'Enhanced Timetable Generator',
        producer: 'AI Timetable System'
      });

      // Generate content based on format
      switch (exportOptions.format) {
        case 'detailed':
          await this.generateDetailedReport(doc, pageWidth, pageHeight, entries, timeSlots, filters, exportOptions);
          break;
        case 'compact':
          await this.generateCompactReport(doc, pageWidth, pageHeight, entries, timeSlots, filters, exportOptions);
          break;
        case 'grid':
          await this.generateGridReport(doc, pageWidth, pageHeight, entries, timeSlots, filters, exportOptions);
          break;
        case 'analytics':
          await this.generateAnalyticsReport(doc, pageWidth, pageHeight, entries, timeSlots, filters, exportOptions);
          break;
      }

      // Add watermark if specified
      if (exportOptions.watermark) {
        this.addWatermark(doc, pageWidth, pageHeight, exportOptions.watermark);
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

  // Generate detailed report with all sections
  private static async generateDetailedReport(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Enhanced cover page with logo and branding
    this.createEnhancedCoverPage(doc, pageWidth, pageHeight, entries, filters, options);

    // Table of contents
    doc.addPage();
    this.createTableOfContents(doc, pageWidth);

    // Executive summary with charts
    doc.addPage();
    this.createEnhancedExecutiveSummary(doc, pageWidth, entries, timeSlots, options);

    // Daily schedules with improved layout
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    for (const day of days) {
      const dayEntries = entries.filter(entry => entry.day === day);
      if (dayEntries.length === 0) continue;

      doc.addPage();
      this.createEnhancedDailySchedule(doc, pageWidth, day, dayEntries, options);
    }

    // Enhanced analytics with visualizations
    if (options?.includeAnalytics) {
      doc.addPage();
      this.createAdvancedAnalytics(doc, pageWidth, entries, options);
    }

    // Student lists if requested
    if (options?.includeStudentList) {
      doc.addPage();
      this.createStudentLists(doc, pageWidth, entries, options);
    }

    // Appendices
    doc.addPage();
    this.createAppendices(doc, pageWidth, entries, timeSlots, options);
  }

  // Enhanced cover page with professional design
  private static createEnhancedCoverPage(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    entries: EnhancedTimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Gradient background
    this.createGradientBackground(doc, pageWidth, pageHeight);

    // Logo placeholder (if provided)
    if (options?.customLogo) {
      // Add logo implementation here
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth / 2, 40, 20, 'F');
    }

    // Enhanced title with better typography
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    
    const mainTitle = this.generateMainTitle(entries, filters);
    doc.text(mainTitle, pageWidth / 2, 80, { align: "center" });

    // Subtitle with institution name
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    const subtitle = options?.institutionName || "Academic Institution";
    doc.text(subtitle, pageWidth / 2, 100, { align: "center" });

    // Professional information card
    this.createInformationCard(doc, pageWidth, entries, filters, options);

    // Key metrics dashboard
    this.createMetricsDashboard(doc, pageWidth, entries);

    // Footer with generation info
    this.createCoverFooter(doc, pageWidth, pageHeight, options);
  }

  // Create gradient background
  private static createGradientBackground(doc: jsPDF, pageWidth: number, pageHeight: number) {
    const colors = this.currentColorScheme;
    
    // Create gradient effect with multiple rectangles
    for (let i = 0; i < 20; i++) {
      const alpha = 1 - (i / 20);
      const color = this.interpolateColor(colors.primary, colors.secondary, i / 20);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(0, i * (pageHeight / 20), pageWidth, pageHeight / 20, 'F');
    }
  }

  // Color interpolation for gradients
  private static interpolateColor(color1: number[], color2: number[], factor: number): number[] {
    return [
      Math.round(color1[0] + factor * (color2[0] - color1[0])),
      Math.round(color1[1] + factor * (color2[1] - color1[1])),
      Math.round(color1[2] + factor * (color2[2] - color1[2]))
    ];
  }

  // Enhanced information card with better design
  private static createInformationCard(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    const cardY = 120;
    const cardHeight = 80;
    
    // Card background with shadow effect
    doc.setFillColor(0, 0, 0, 0.1);
    doc.roundedRect(27, cardY + 3, pageWidth - 54, cardHeight, 8, 8, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(25, cardY, pageWidth - 50, cardHeight, 8, 8, 'F');
    
    doc.setDrawColor(...this.currentColorScheme.primary);
    doc.setLineWidth(2);
    doc.roundedRect(25, cardY, pageWidth - 50, cardHeight, 8, 8, 'S');

    // Card content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Report Overview", 35, cardY + 15);

    const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);
    
    const reportInfo = [
      `${this.t('generatedOn')}: ${new Date().toLocaleDateString()}`,
      `${this.t('totalSessions')}: ${entries.length.toLocaleString()}`,
      `${this.t('studentsEnrolled')}: ${totalEnrollment.toLocaleString()}`,
      `${this.t('facultyMembers')}: ${new Set(entries.map(e => e.faculty.name)).size}`,
      `${this.t('roomsUtilized')}: ${new Set(entries.map(e => e.room.name)).size}`
    ];

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    reportInfo.forEach((info, index) => {
      const yPos = cardY + 30 + (index * 8);
      doc.text(info, 35, yPos);
    });
  }

  // Enhanced metrics dashboard with visual indicators
  private static createMetricsDashboard(doc: jsPDF, pageWidth: number, entries: EnhancedTimetableEntry[]) {
    const dashboardY = 220;
    const metrics = this.calculateEnhancedMetrics(entries);
    
    const metricBoxes = [
      { 
        label: "Quality Score", 
        value: `${metrics.qualityScore}%`, 
        color: this.currentColorScheme.accent,
        icon: "★"
      },
      { 
        label: "Utilization", 
        value: `${metrics.avgUtilization}%`, 
        color: this.currentColorScheme.primary,
        icon: "▲"
      },
      { 
        label: "Efficiency", 
        value: `${metrics.efficiency}%`, 
        color: this.currentColorScheme.warning,
        icon: "◆"
      }
    ];

    const boxWidth = (pageWidth - 80) / 3;
    metricBoxes.forEach((metric, index) => {
      const x = 30 + (index * (boxWidth + 10));
      
      // Box with gradient effect
      doc.setFillColor(...metric.color);
      doc.roundedRect(x, dashboardY, boxWidth, 40, 5, 5, 'F');
      
      // Icon
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(metric.icon, x + 10, dashboardY + 25);
      
      // Value
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(metric.value, x + boxWidth - 10, dashboardY + 20, { align: "right" });
      
      // Label
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(metric.label, x + boxWidth - 10, dashboardY + 32, { align: "right" });
    });
  }

  // Enhanced executive summary with charts
  private static createEnhancedExecutiveSummary(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, this.t('executiveSummary'));

    const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);

    // Summary statistics table
    const summaryData = [
      [this.t('totalSessions'), entries.length.toString(), "Scheduled across all days"],
      [this.t('studentsEnrolled'), totalEnrollment.toLocaleString(), "Active registrations"],
      ["Academic Programs", new Set(entries.map(e => e.course.semester.program.name)).size.toString(), "Degree programs"],
      ["Departments", new Set(entries.map(e => e.course.semester.program.department?.name).filter(Boolean)).size.toString(), "Academic departments"],
      [this.t('facultyMembers'), new Set(entries.map(e => e.faculty.name)).size.toString(), "Teaching staff"],
      ["Rooms Utilized", new Set(entries.map(e => e.room.name)).size.toString(), "Physical spaces"],
      ["Time Slots", timeSlots.length.toString(), "Daily periods"],
      ["Avg Class Size", (totalEnrollment / entries.length).toFixed(1), "Students per session"]
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
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70, fontSize: 11 },
        1: { halign: 'center', cellWidth: 30, fontStyle: 'bold', fontSize: 11 },
        2: { cellWidth: 80, fontSize: 11 }
      }
    });

    // Capacity utilization analysis
    const capacityStats = this.getCapacityStatistics(entries);
    const capacityData = [
      ["Perfect (80-100%)", capacityStats.perfect.toString(), `${((capacityStats.perfect / entries.length) * 100).toFixed(1)}%`],
      ["Good (60-80%)", capacityStats.good.toString(), `${((capacityStats.good / entries.length) * 100).toFixed(1)}%`],
      ["Acceptable (40-60%)", capacityStats.acceptable.toString(), `${((capacityStats.acceptable / entries.length) * 100).toFixed(1)}%`],
      ["Underutilized (<40%)", capacityStats.underutilized.toString(), `${((capacityStats.underutilized / entries.length) * 100).toFixed(1)}%`],
      ["Overcrowded (>100%)", capacityStats.overcrowded.toString(), `${((capacityStats.overcrowded / entries.length) * 100).toFixed(1)}%`]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [[this.t('capacityAnalysis'), "Sessions", "Percentage"]],
      body: capacityData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.accent, 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 12
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80, fontSize: 10 },
        1: { halign: 'center', cellWidth: 30, fontSize: 10 },
        2: { halign: 'center', cellWidth: 30, fontStyle: 'bold', fontSize: 10 }
      }
    });

    // Add charts if enabled
    if (options?.includeCharts) {
      const facultyData = this.prepareFacultyWorkloadData(entries);
      this.createBarChart(doc, 30, (doc as any).lastAutoTable.finalY + 20, pageWidth - 60, 60, facultyData, "Faculty Workload Distribution");
    }
  }

  // Table of contents
  private static createTableOfContents(doc: jsPDF, pageWidth: number) {
    this.addEnhancedPageHeader(doc, pageWidth, "Table of Contents");
    
    const contents = [
      { title: "Executive Summary", page: 3 },
      { title: "Daily Schedules", page: 4 },
      { title: "Analytics & Insights", page: 11 },
      { title: "Faculty Workload", page: 12 },
      { title: "Room Utilization", page: 13 },
      { title: "Appendices", page: 14 }
    ];

    let currentY = 70;
    contents.forEach(item => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(item.title, 30, currentY);
      
      // Dotted line
      const dots = ".".repeat(Math.floor((pageWidth - 100) / 3));
      doc.setFontSize(10);
      doc.text(dots, 80, currentY);
      
      // Page number
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(item.page.toString(), pageWidth - 30, currentY, { align: "right" });
      
      currentY += 15;
    });
  }

  // Enhanced daily schedule with better layout
  private static createEnhancedDailySchedule(
    doc: jsPDF,
    pageWidth: number,
    day: string,
    dayEntries: EnhancedTimetableEntry[],
    options?: ExportOptions
  ) {
    const dayName = day.charAt(0) + day.slice(1).toLowerCase();
    this.addEnhancedPageHeader(doc, pageWidth, `${dayName} Schedule`);

    // Day statistics bar
    this.createDayStatistics(doc, pageWidth, dayEntries);

    // Timeline view
    this.createTimelineView(doc, pageWidth, dayEntries, options);
  }

  // Create timeline view for daily schedule
  private static createTimelineView(
    doc: jsPDF,
    pageWidth: number,
    dayEntries: EnhancedTimetableEntry[],
    options?: ExportOptions
  ) {
    const timelineX = 30;
    const timelineWidth = pageWidth - 60;
    let currentY = 100;

    // Group by time slots
    const entriesByTime = new Map<string, EnhancedTimetableEntry[]>();
    dayEntries
      .sort((a, b) => a.timeslot.start.localeCompare(b.timeslot.start))
      .forEach(entry => {
        const timeKey = `${entry.timeslot.start}-${entry.timeslot.end}`;
        if (!entriesByTime.has(timeKey)) {
          entriesByTime.set(timeKey, []);
        }
        entriesByTime.get(timeKey)!.push(entry);
      });

    for (const [timeKey, timeEntries] of entriesByTime) {
      const [startTime, endTime] = timeKey.split('-');
      
      // Time indicator
      doc.setFillColor(...this.currentColorScheme.primary);
      doc.circle(timelineX, currentY, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("●", timelineX, currentY + 2, { align: "center" });
      
      // Time label
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${this.formatTime(startTime)} - ${this.formatTime(endTime)}`, timelineX + 20, currentY + 5);

      // Timeline line
      doc.setDrawColor(...this.currentColorScheme.light);
      doc.setLineWidth(2);
      doc.line(timelineX, currentY + 10, timelineX, currentY + 40);

      // Course cards
      this.createCourseCards(doc, timelineX + 30, currentY, timeEntries, timelineWidth - 50);
      
      currentY += Math.max(50, timeEntries.length * 15 + 20);
      
      if (currentY > 250) {
        doc.addPage();
        this.addEnhancedPageHeader(doc, pageWidth, `${timeKey} Schedule (continued)`);
        currentY = 70;
      }
    }
  }

  // Create course cards for timeline
  private static createCourseCards(
    doc: jsPDF,
    x: number,
    y: number,
    entries: EnhancedTimetableEntry[],
    maxWidth: number
  ) {
    entries.forEach((entry, index) => {
      const cardY = y + (index * 15);
      const cardHeight = 12;
      
      // Card background
      const courseTypeColor = entry.course.type === 'LAB' 
        ? this.currentColorScheme.warning 
        : this.currentColorScheme.accent;
      
      doc.setFillColor(...courseTypeColor, 0.1);
      doc.roundedRect(x, cardY, maxWidth, cardHeight, 2, 2, 'F');
      
      doc.setDrawColor(...courseTypeColor);
      doc.setLineWidth(1);
      doc.roundedRect(x, cardY, maxWidth, cardHeight, 2, 2, 'S');
      
      // Course info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(entry.course.name, x + 5, cardY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.text(`${entry.faculty.name} | ${entry.room.name}`, x + 5, cardY + 9);
      
      // Enrollment indicator
      const enrollmentCount = entry.course.enrollments?.length || 0;
      if (enrollmentCount > 0) {
        doc.setFontSize(8);
        doc.text(`${enrollmentCount} students`, x + maxWidth - 5, cardY + 7, { align: "right" });
      }
    });
  }

  // Advanced analytics with charts
  private static createAdvancedAnalytics(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, this.t('analytics'));

    // Create multiple chart sections
    let currentY = 70;

    // Faculty workload chart
    if (options?.includeCharts) {
      const facultyData = this.prepareFacultyWorkloadData(entries);
      this.createBarChart(doc, 30, currentY, pageWidth - 60, 60, facultyData, "Faculty Workload Distribution");
      currentY += 80;
    }

    // Room utilization pie chart
    if (options?.includeCharts) {
      const roomData = this.prepareRoomUtilizationData(entries);
      this.createPieChart(doc, 30, currentY, 80, roomData, "Room Utilization");
      currentY += 100;
    }

    // Capacity analysis table
    this.createCapacityAnalysisTable(doc, 30, currentY, pageWidth - 60, entries);
  }

  // Create simple bar chart
  private static createBarChart(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: ChartData,
    title: string
  ) {
    // Chart title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + width / 2, y - 5, { align: "center" });

    // Chart background
    doc.setFillColor(250, 250, 250);
    doc.rect(x, y, width, height, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, width, height, 'S');

    // Draw bars
    const maxValue = Math.max(...data.values);
    const barWidth = width / data.values.length * 0.8;
    const barSpacing = width / data.values.length * 0.2;

    data.values.forEach((value, index) => {
      const barHeight = (value / maxValue) * (height - 20);
      const barX = x + (index * (barWidth + barSpacing)) + barSpacing / 2;
      const barY = y + height - barHeight - 10;

      // Bar
      doc.setFillColor(...this.currentColorScheme.primary);
      doc.rect(barX, barY, barWidth, barHeight, 'F');

      // Value label
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(value.toString(), barX + barWidth / 2, barY - 2, { align: "center" });

      // Category label
      const label = data.labels[index].length > 8 
        ? data.labels[index].substring(0, 6) + '..' 
        : data.labels[index];
      doc.text(label, barX + barWidth / 2, y + height + 5, { align: "center" });
    });
  }

  // Create simple pie chart
  private static createPieChart(
    doc: jsPDF,
    x: number,
    y: number,
    radius: number,
    data: ChartData,
    title: string
  ) {
    // Chart title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + radius, y - radius - 10, { align: "center" });

    const centerX = x + radius;
    const centerY = y;
    const total = data.values.reduce((sum, val) => sum + val, 0);
    
    let currentAngle = 0;
    
    data.values.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Draw slice
      doc.setFillColor(...this.hexToRgb(data.colors[index] || '#3498db'));
      
      // Create path for pie slice
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      // Simple approximation for pie slice
      const midAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(midAngle) * (radius + 15);
      const labelY = centerY + Math.sin(midAngle) * (radius + 15);
      
      // Label
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`${data.labels[index]}: ${value}`, labelX, labelY);
      
      currentAngle += sliceAngle;
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

  private static hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private static calculateEnhancedMetrics(entries: EnhancedTimetableEntry[]) {
    const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);
    const avgUtilization = entries.length > 0 ? (totalEnrollment / entries.length / 50 * 100) : 0;
    
    return {
      qualityScore: Math.min(95, Math.round(avgUtilization + 20)),
      avgUtilization: Math.round(avgUtilization),
      efficiency: Math.min(98, Math.round(avgUtilization * 1.2))
    };
  }

  private static prepareFacultyWorkloadData(entries: EnhancedTimetableEntry[]): ChartData {
    const facultyWorkload = new Map<string, number>();
    
    entries.forEach(entry => {
      const name = entry.faculty.name.split(' ').slice(-1)[0]; // Last name only
      facultyWorkload.set(name, (facultyWorkload.get(name) || 0) + 1);
    });

    const sortedFaculty = Array.from(facultyWorkload.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Top 8

    return {
      labels: sortedFaculty.map(([name]) => name),
      values: sortedFaculty.map(([, count]) => count),
      colors: sortedFaculty.map(() => '#3498db')
    };
  }

  private static prepareRoomUtilizationData(entries: EnhancedTimetableEntry[]): ChartData {
    const roomTypes = new Map<string, number>();
    
    entries.forEach(entry => {
      roomTypes.set(entry.room.type, (roomTypes.get(entry.room.type) || 0) + 1);
    });

    return {
      labels: Array.from(roomTypes.keys()),
      values: Array.from(roomTypes.values()),
      colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
    };
  }

  // Enhanced page header
  private static addEnhancedPageHeader(doc: jsPDF, pageWidth: number, title: string) {
    // Header background with gradient effect
    doc.setFillColor(...this.currentColorScheme.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Header accent line
    doc.setFillColor(...this.currentColorScheme.accent);
    doc.rect(0, 32, pageWidth, 3, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 22, { align: "center" });
    
    // Page number
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.text(`Page ${pageNum}`, pageWidth - 20, 25, { align: "right" });
    
    doc.setTextColor(0, 0, 0);
  }

  // Generate enhanced filename
  private static generateFilename(
    entries: EnhancedTimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ): string {
    const date = new Date().toISOString().split('T')[0];
    const format = options?.format || 'detailed';
    
    let filename = `timetable-${format}-${date}`;
    
    if (filters?.programId && entries.length > 0) {
      const program = entries[0].course.semester.program;
      const programCode = program.code || program.name.substring(0, 4).toUpperCase();
      filename = `${programCode}-${format}-${date}`;
    }
    
    return `${filename}.pdf`;
  }

  // Generate export message
  private static generateExportMessage(
    entries: EnhancedTimetableEntry[],
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

  // Additional utility methods for enhanced functionality
  private static createDayStatistics(doc: jsPDF, pageWidth: number, dayEntries: EnhancedTimetableEntry[]) {
    const statsY = 50;
    const totalStudents = dayEntries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);
    const uniqueRooms = new Set(dayEntries.map(e => e.room.name)).size;
    const uniqueFaculty = new Set(dayEntries.map(e => e.faculty.name)).size;

    // Statistics bar
    doc.setFillColor(...this.currentColorScheme.light);
    doc.roundedRect(30, statsY, pageWidth - 60, 25, 5, 5, 'F');
    
    doc.setDrawColor(...this.currentColorScheme.primary);
    doc.setLineWidth(1);
    doc.roundedRect(30, statsY, pageWidth - 60, 25, 5, 5, 'S');

    // Statistics content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    const stats = [
      `${dayEntries.length} Sessions`,
      `${totalStudents} Students`,
      `${uniqueRooms} Rooms`,
      `${uniqueFaculty} Faculty`
    ];

    const statWidth = (pageWidth - 80) / stats.length;
    stats.forEach((stat, index) => {
      const x = 40 + (index * statWidth);
      doc.text(stat, x, statsY + 15, { align: "center" });
    });
  }

  private static createCapacityAnalysisTable(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    entries: EnhancedTimetableEntry[]
  ) {
    // Analyze capacity utilization
    const capacityStats = {
      perfect: 0,
      good: 0,
      acceptable: 0,
      overcrowded: 0,
      underutilized: 0
    };

    entries.forEach(entry => {
      const enrollmentCount = entry.course.enrollments?.length || 0;
      const roomCapacity = entry.room.maxCapacity || entry.room.enhancement?.capacity || 50;
      const utilization = (enrollmentCount / roomCapacity) * 100;

      if (utilization >= 80 && utilization <= 100) capacityStats.perfect++;
      else if (utilization >= 60 && utilization < 80) capacityStats.good++;
      else if (utilization > 100) capacityStats.overcrowded++;
      else if (utilization < 40) capacityStats.underutilized++;
      else capacityStats.acceptable++;
    });

    const tableData = [
      ["Perfect (80-100%)", capacityStats.perfect.toString(), "Optimal utilization"],
      ["Good (60-80%)", capacityStats.good.toString(), "Good utilization"],
      ["Acceptable (40-60%)", capacityStats.acceptable.toString(), "Acceptable utilization"],
      ["Underutilized (<40%)", capacityStats.underutilized.toString(), "Room too large"],
      ["Overcrowded (>100%)", capacityStats.overcrowded.toString(), "Room too small"]
    ];

    autoTable(doc, {
      startY: y,
      head: [["Capacity Status", "Count", "Description"]],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.primary,
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { fontSize: 11, cellPadding: 5 },
      margin: { left: x, right: 20 }
    });
  }

  private static createStudentLists(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Student Enrollment Lists");

    let currentY = 60;

    // Group by course
    const courseMap = new Map<string, EnhancedTimetableEntry>();
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
        const studentData = entry.course.enrollments
          .filter(enrollment => enrollment.isActive)
          .map((enrollment, index) => [
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

  private static createAppendices(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    options?: ExportOptions
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Appendices");

    let currentY = 60;

    // Appendix A: Time Slots
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Appendix A: Time Slots", 30, currentY);
    currentY += 15;

    const timeSlotData = timeSlots.map((slot, index) => [
      (index + 1).toString(),
      this.formatTime(slot.start),
      this.formatTime(slot.end),
      `${slot.end.split(':')[0] - slot.start.split(':')[0]} hours`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Start Time", "End Time", "Duration"]],
      body: timeSlotData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.currentColorScheme.primary,
        textColor: 255
      },
      styles: { fontSize: 11, cellPadding: 5 },
      margin: { left: 30, right: 30 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Appendix B: Room Information
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Appendix B: Room Information", 30, currentY);
    currentY += 15;

    const roomMap = new Map<string, any>();
    entries.forEach(entry => {
      if (!roomMap.has(entry.room.name)) {
        roomMap.set(entry.room.name, entry.room);
      }
    });

    const roomData = Array.from(roomMap.values()).map(room => [
      room.name,
      room.type,
      (room.maxCapacity || room.enhancement?.capacity || 'N/A').toString(),
      room.enhancement?.equipment?.join(', ') || 'Standard'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Room Name", "Type", "Capacity", "Equipment"]],
      body: roomData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.secondary,
        textColor: 255
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 60 }
      },
      margin: { left: 30, right: 30 }
    });
  }

  private static createCoverFooter(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    options?: ExportOptions
  ) {
    const footerY = pageHeight - 30;
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const footerText = `Generated by ${options?.institutionName || 'AI Timetable System'} • ${new Date().toLocaleDateString()}`;
    doc.text(footerText, pageWidth / 2, footerY, { align: "center" });
  }

  private static addWatermark(doc: jsPDF, pageWidth: number, pageHeight: number, watermarkText: string) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Semi-transparent watermark
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(50);
      doc.setFont("helvetica", "bold");
      
      // Rotate and center the watermark
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      doc.text(watermarkText, centerX, centerY, {
        align: "center",
        angle: 45
      });
    }
  }

  private static generateMainTitle(entries: EnhancedTimetableEntry[], filters?: any): string {
    if (filters?.programId && entries.length > 0) {
      const program = entries[0].course.semester.program;
      return `${program.code || program.name.toUpperCase()} TIMETABLE`;
    }
    
    if (filters?.semesterId && entries.length > 0) {
      const semester = entries[0].course.semester;
      const ordinal = this.getSemesterOrdinal(semester.number);
      return `${semester.program.name.toUpperCase()} - ${ordinal.toUpperCase()} SEMESTER`;
    }
    
    return this.t('universityTimetable');
  }

  private static generateTitle(entries: EnhancedTimetableEntry[], filters?: any): string {
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

  // Compact report format
  private static async generateCompactReport(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Simplified cover
    this.createCompactCover(doc, pageWidth, entries, filters, options);
    
    // Single page summary
    doc.addPage();
    this.createCompactSummary(doc, pageWidth, entries, timeSlots);
  }

  private static createCompactCover(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Simple header
    doc.setFillColor(...this.currentColorScheme.primary);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(this.generateMainTitle(entries, filters), pageWidth / 2, 30, { align: "center" });
    
    // Quick stats
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    
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
    entries: EnhancedTimetableEntry[],
    timeSlots: any[]
  ) {
    this.addEnhancedPageHeader(doc, pageWidth, "Timetable Summary");
    
    // Create a condensed weekly grid
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    
    // Grid layout
    const gridData = [];
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

  // Grid report format
  private static async generateGridReport(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Use landscape orientation for grid
    doc = new jsPDF('landscape', 'mm', 'a4');
    const landscapeWidth = doc.internal.pageSize.getWidth();
    
    this.addEnhancedPageHeader(doc, landscapeWidth, "Weekly Timetable Grid");
    
    // Create comprehensive grid
    this.createWeeklyGrid(doc, landscapeWidth, entries, timeSlots);
  }

  private static createWeeklyGrid(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[]
  ) {
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    
    // Create grid data
    const gridData = [];
    
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
        valign: 'top',
        lineColor: [200, 200, 200],
        lineWidth: 0.5
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

  // Analytics-only report
  private static async generateAnalyticsReport(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    entries: EnhancedTimetableEntry[],
    timeSlots: any[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Cover page
    this.createAnalyticsCover(doc, pageWidth, entries, filters, options);
    
    // Multiple analytics pages
    doc.addPage();
    this.createAdvancedAnalytics(doc, pageWidth, entries, options);
    
    doc.addPage();
    this.createDetailedStatistics(doc, pageWidth, entries);
  }

  private static createAnalyticsCover(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[],
    filters?: any,
    options?: ExportOptions
  ) {
    // Analytics-focused cover design
    doc.setFillColor(...this.currentColorScheme.secondary);
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("TIMETABLE ANALYTICS", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Comprehensive Statistical Analysis", pageWidth / 2, 60, { align: "center" });
    
    // Key metrics preview
    const metrics = this.calculateEnhancedMetrics(entries);
    this.createMetricsDashboard(doc, pageWidth, entries);
  }

  private static createDetailedStatistics(
    doc: jsPDF,
    pageWidth: number,
    entries: EnhancedTimetableEntry[]
  ) {
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
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
    
    // Time slot utilization
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Time Slot Utilization", 30, currentY);
    currentY += 15;
    
    const timeSlotUsage = new Map<string, number>();
    entries.forEach(entry => {
      const timeKey = `${entry.timeslot.start}-${entry.timeslot.end}`;
      timeSlotUsage.set(timeKey, (timeSlotUsage.get(timeKey) || 0) + 1);
    });
    
    const timeSlotData = Array.from(timeSlotUsage.entries()).map(([time, count]) => [
      time,
      count.toString(),
      `${((count / entries.length) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [["Time Slot", "Sessions", "Utilization"]],
      body: timeSlotData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.currentColorScheme.warning,
        textColor: 255
      },
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: 30, right: 30 }
    });
  }

  // Get capacity statistics for analysis
  private static getCapacityStatistics(entries: EnhancedTimetableEntry[]) {
    const stats = {
      perfect: 0,
      good: 0,
      acceptable: 0,
      overcrowded: 0,
      underutilized: 0
    };

    entries.forEach(entry => {
      const enrollmentCount = entry.course.enrollments?.length || 0;
      if (enrollmentCount > 0) {
        const roomCapacity = entry.room.maxCapacity || entry.room.enhancement?.capacity || 50;
        const utilization = (enrollmentCount / roomCapacity) * 100;

        if (utilization >= 80 && utilization <= 100) {
          stats.perfect++;
        } else if (utilization >= 60 && utilization < 80) {
          stats.good++;
        } else if (utilization > 100) {
          stats.overcrowded++;
        } else if (utilization < 40) {
          stats.underutilized++;
        } else {
          stats.acceptable++;
        }
      }
    });

    return stats;
  }
}