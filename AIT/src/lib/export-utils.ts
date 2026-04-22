import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toastUtils } from "./toast-utils";
import { EnhancedExportUtils } from "./enhanced-export-utils";

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

export class ExportUtils {
  static formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  static getSemesterOrdinal(number: number): string {
    if (number === 1) return "1st";
    if (number === 2) return "2nd";
    if (number === 3) return "3rd";
    return `${number}th`;
  }

  static getSemesterRoman(number: number): string {
    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[number] || `${number}`;
  }

  static formatSemesterShort(entry: TimetableEntry): string {
    const programName = entry.course.semester.program.name;
    const semesterNumber = entry.course.semester.number;
    
    // Extract program abbreviation
    let programAbbr = '';
    
    // Check if program name contains abbreviation in parentheses
    const abbreviationMatch = programName.match(/\(([A-Z]+)\)/);
    if (abbreviationMatch) {
      programAbbr = abbreviationMatch[1];
    } else if (programName.includes('Computer Science')) {
      programAbbr = 'BSCS';
    } else if (programName.includes('Business Administration')) {
      programAbbr = 'BBA';
    } else if (programName.includes('Engineering')) {
      programAbbr = 'BE';
    } else if (programName.includes('Arts')) {
      programAbbr = 'BA';
    } else {
      // Fallback: take first letters of each word
      programAbbr = programName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 4);
    }
    
    return `${programAbbr}-${this.getSemesterRoman(semesterNumber)}`;
  }

  static getRoomCapacity(room: TimetableEntry['room']): number {
    if (room.maxCapacity) return room.maxCapacity;
    if (room.enhancement?.capacity) return room.enhancement.capacity;
    if (room.minCapacity) return room.minCapacity;
    return room.type === 'LAB' ? 25 : 50;
  }

  static getCapacityInfo(enrollmentCount: number, room: TimetableEntry['room']) {
    const capacity = this.getRoomCapacity(room);
    const utilization = capacity > 0 ? (enrollmentCount / capacity) * 100 : 0;
    
    let status: 'Perfect' | 'Good' | 'Acceptable' | 'Overcrowded' | 'Underutilized' = 'Acceptable';
    
    if (utilization >= 80 && utilization <= 100) {
      status = 'Perfect';
    } else if (utilization >= 60 && utilization < 80) {
      status = 'Good';
    } else if (utilization > 100) {
      status = 'Overcrowded';
    } else if (utilization < 40) {
      status = 'Underutilized';
    }
    
    return {
      capacity,
      utilization: Math.round(utilization),
      status
    };
  }

  // Enhanced PDF export with multiple format options
  static async exportDetailedTimetablePDF(
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: { programId?: number; semesterId?: number },
    options?: {
      format?: 'detailed' | 'compact' | 'grid' | 'analytics';
      includeAnalytics?: boolean;
      includeCharts?: boolean;
      colorScheme?: 'professional' | 'vibrant' | 'minimal';
      language?: 'en' | 'es';
    }
  ): Promise<void> {
    // Use legacy export for now until enhanced version is fully debugged
    return this.exportLegacyDetailedTimetablePDF(entries, timeSlots, filters);
  }

  // Legacy detailed export (kept for backward compatibility)
  static async exportLegacyDetailedTimetablePDF(
    entries: TimetableEntry[],
    timeSlots: TimeSlot[],
    filters?: { programId?: number; semesterId?: number }
  ): Promise<void> {
    toastUtils.exportStarted("Professional Timetable Report");

    try {
      // Validate input data
      if (!entries || entries.length === 0) {
        throw new Error("No timetable entries to export");
      }

      const doc = new jsPDF("portrait", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      const totalEnrollment = entries.reduce((sum, entry) => sum + (entry.course.enrollments?.length || 0), 0);

      // ===== COVER PAGE =====
      this.createCoverPage(doc, pageWidth, entries, totalEnrollment, filters);

      // ===== EXECUTIVE SUMMARY =====
      doc.addPage();
      this.createExecutiveSummary(doc, pageWidth, entries, timeSlots, totalEnrollment);

      // ===== DETAILED DAILY SCHEDULES =====
      for (const day of days) {
        const dayEntries = entries.filter(entry => entry.day === day);
        if (dayEntries.length === 0) continue;

        doc.addPage();
        this.createDailySchedulePage(doc, pageWidth, day, dayEntries);
      }

      // ===== ANALYTICS SUMMARY =====
      doc.addPage();
      this.createAnalyticsSummary(doc, pageWidth, entries);

      // Save the PDF with descriptive filename
      let filename = `professional-timetable-report-${new Date().toISOString().split("T")[0]}`;
      
      if (filters?.programId && entries.length > 0) {
        const programName = entries[0].course.semester.program.name;
        const programAbbr = this.formatSemesterShort(entries[0]).split('-')[0];
        filename = `${programAbbr}-timetable-report-${new Date().toISOString().split("T")[0]}`;
      }
      
      if (filters?.semesterId && entries.length > 0) {
        const semester = entries[0].course.semester;
        const programAbbr = this.formatSemesterShort(entries[0]).split('-')[0];
        const semesterRoman = this.getSemesterRoman(semester.number);
        filename = `${programAbbr}-semester-${semesterRoman}-timetable-${new Date().toISOString().split("T")[0]}`;
      }
      
      doc.save(`${filename}.pdf`);

      // Dynamic toast message based on what was exported
      let exportMessage = "Professional Timetable Report";
      if (filters?.programId && entries.length > 0) {
        const programName = entries[0].course.semester.program.name;
        exportMessage = `${programName} Timetable Report`;
      }
      if (filters?.semesterId && entries.length > 0) {
        const semester = entries[0].course.semester;
        const semesterOrdinal = this.getSemesterOrdinal(semester.number);
        exportMessage = `${semester.program.name} - ${semesterOrdinal} Semester Report`;
      }
      
      toastUtils.exportCompleted(exportMessage, `${filename}.pdf`);
    } catch (error) {
      console.error("Professional PDF export failed:", error);
      toastUtils.error(
        "PDF Export Failed",
        "An error occurred while generating the professional timetable report."
      );
    }
  }

  // Create professional cover page
  private static createCoverPage(
    doc: jsPDF, 
    pageWidth: number, 
    entries: TimetableEntry[], 
    totalEnrollment: number,
    filters?: { programId?: number; semesterId?: number }
  ) {
    // Header with gradient effect
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 70, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    
    // Dynamic title based on filters
    let mainTitle = "UNIVERSITY TIMETABLE";
    let subTitle = "Professional Academic Schedule Report";
    
    if (filters?.programId && entries.length > 0) {
      const programName = entries[0].course.semester.program.name;
      const programAbbr = this.formatSemesterShort(entries[0]).split('-')[0];
      mainTitle = `${programAbbr} TIMETABLE`;
      subTitle = `${programName} - Academic Schedule`;
    }
    
    if (filters?.semesterId && entries.length > 0) {
      const semester = entries[0].course.semester;
      const programAbbr = this.formatSemesterShort(entries[0]).split('-')[0];
      const semesterOrdinal = this.getSemesterOrdinal(semester.number);
      mainTitle = `${programAbbr} - ${semesterOrdinal.toUpperCase()} SEMESTER`;
      subTitle = `${semester.program.name} - Semester Schedule`;
    }
    
    doc.text(mainTitle, pageWidth / 2, 30, { align: "center" });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text(subTitle, pageWidth / 2, 50, { align: "center" });

    doc.setTextColor(0, 0, 0);

    // Report information box
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(25, 90, pageWidth - 50, 100, 5, 5, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.roundedRect(25, 90, pageWidth - 50, 100, 5, 5, 'S');

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Report Overview", 35, 110);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    let subtitle = "Complete Academic Schedule - All Programs";
    if (filters?.programId) {
      const program = entries[0]?.course.semester.program.name;
      subtitle = `${program} - Comprehensive Analysis`;
    }
    if (filters?.semesterId) {
      const semester = entries[0]?.course.semester;
      subtitle = `${semester.program.name} - ${this.getSemesterOrdinal(semester.number)} Semester`;
    }

    const reportInfo = [
      `Scope: ${subtitle}`,
      `Generated: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`,
      `Total Sessions: ${entries.length}`,
      `Students Enrolled: ${totalEnrollment.toLocaleString()}`,
      `Departments: ${new Set(entries.map(e => e.course.semester.program.department?.name).filter(Boolean)).size}`,
      `Faculty Members: ${new Set(entries.map(e => e.faculty.name)).size}`
    ];

    reportInfo.forEach((info, index) => {
      doc.text(info, 35, 130 + (index * 10));
    });

    // Key metrics preview
    const avgUtilization = this.calculateAverageUtilization(entries);
    const capacityStats = this.getCapacityStatistics(entries);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Performance Indicators", 35, 210);

    // KPI boxes
    const kpis = [
      { label: "Avg Utilization", value: `${avgUtilization}%`, x: 35, color: [52, 152, 219] },
      { label: "Perfect Matches", value: `${capacityStats.perfect}`, x: 120, color: [46, 204, 113] }
    ];

    kpis.forEach(kpi => {
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.roundedRect(kpi.x, 220, 60, 30, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(kpi.value, kpi.x + 30, 235, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(kpi.label, kpi.x + 30, 245, { align: "center" });
    });

    doc.setTextColor(0, 0, 0);
  }

  // Create executive summary with tables
  private static createExecutiveSummary(
    doc: jsPDF, 
    pageWidth: number, 
    entries: TimetableEntry[], 
    timeSlots: TimeSlot[], 
    totalEnrollment: number
  ) {
    this.addPageHeader(doc, pageWidth, "Executive Summary");

    // Summary statistics table
    const summaryData = [
      ["Total Academic Sessions", entries.length.toString(), "Scheduled across all days"],
      ["Student Enrollments", totalEnrollment.toLocaleString(), "Active registrations"],
      ["Academic Programs", new Set(entries.map(e => e.course.semester.program.name)).size.toString(), "Degree programs"],
      ["Departments", new Set(entries.map(e => e.course.semester.program.department?.name).filter(Boolean)).size.toString(), "Academic departments"],
      ["Faculty Members", new Set(entries.map(e => e.faculty.name)).size.toString(), "Teaching staff"],
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
        fillColor: [41, 128, 185], 
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
      head: [["Capacity Status", "Sessions", "Percentage"]],
      body: capacityData,
      theme: 'grid',
      headStyles: { 
        fillColor: [46, 204, 113], 
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
  }

  // Create detailed daily schedule page
  private static createDailySchedulePage(
    doc: jsPDF, 
    pageWidth: number, 
    day: string, 
    dayEntries: TimetableEntry[]
  ) {
    const dayName = day.charAt(0) + day.slice(1).toLowerCase();
    this.addPageHeader(doc, pageWidth, `${dayName} Schedule`);

    // Day statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`${dayEntries.length} sessions | ${new Set(dayEntries.map(e => e.room.name)).size} rooms used`, pageWidth / 2, 50, { align: "center" });

    // Group entries by time slot
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

    let currentY = 70;

    // Create sections for each time slot
    for (const [timeKey, timeEntries] of entriesByTime) {
      const [startTime, endTime] = timeKey.split('-');
      
      // Time heading
      doc.setFillColor(52, 73, 94);
      doc.rect(20, currentY, pageWidth - 40, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${this.formatTime(startTime)} - ${this.formatTime(endTime)}`, pageWidth / 2, currentY + 8, { align: "center" });
      
      doc.setTextColor(0, 0, 0);
      currentY += 15;

      // Create table data for this time slot
      const timeSlotData = timeEntries.map(entry => {
        return [
          `${entry.course.name}\n${entry.course.code || 'N/A'}`,
          entry.faculty.name,
          entry.room.name, // Clean room name without type
          this.formatSemesterShort(entry)
        ];
      });

      // Create table for this time slot
      autoTable(doc, {
        startY: currentY,
        head: [["Course", "Faculty", "Room", "Semester"]],
        body: timeSlotData,
        theme: 'striped',
        headStyles: { 
          fillColor: [155, 89, 182], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 11
        },
        styles: { 
          fontSize: 11, 
          cellPadding: 5,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 70, halign: 'left', fontStyle: 'bold', fontSize: 11 },
          1: { cellWidth: 50, halign: 'left', fontSize: 11 },
          2: { cellWidth: 35, halign: 'center', fontSize: 11 },
          3: { cellWidth: 25, halign: 'center', fontStyle: 'bold', fontSize: 11 }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Add page break if needed
      if (currentY > 250) {
        doc.addPage();
        this.addPageHeader(doc, pageWidth, `${dayName} Schedule (continued)`);
        currentY = 60;
      }
    }
  }

  // Create analytics summary page
  private static createAnalyticsSummary(doc: jsPDF, pageWidth: number, entries: TimetableEntry[]) {
    this.addPageHeader(doc, pageWidth, "Analytics & Insights");

    let currentY = 60;

    // Faculty workload analysis
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Faculty Workload Analysis", 20, currentY);
    currentY += 10;

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

    const facultyData = Array.from(facultyWorkload.values())
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10) // Top 10 faculty
      .map(faculty => [
        faculty.name.length > 25 ? faculty.name.substring(0, 22) + '...' : faculty.name,
        faculty.sessions.toString(),
        faculty.students.toString(),
        faculty.courses.size.toString(),
        (faculty.students / faculty.sessions).toFixed(1)
      ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Faculty Member", "Sessions", "Students", "Courses", "Avg Class Size"]],
      body: facultyData,
      theme: 'striped',
      headStyles: { 
        fillColor: [230, 126, 34], 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold', fontSize: 10 },
        1: { cellWidth: 25, halign: 'center', fontSize: 10 },
        2: { cellWidth: 25, halign: 'center', fontSize: 10 },
        3: { cellWidth: 25, halign: 'center', fontSize: 10 },
        4: { cellWidth: 30, halign: 'center', fontStyle: 'bold', fontSize: 10 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Room utilization analysis
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Room Utilization Analysis", 20, currentY);
    currentY += 10;

    const roomStats = new Map<string, {
      name: string;
      type: string;
      sessions: number;
      students: number;
      capacity: number;
    }>();

    entries.forEach(entry => {
      const roomName = entry.room.name;
      if (!roomStats.has(roomName)) {
        roomStats.set(roomName, {
          name: roomName,
          type: entry.room.type,
          sessions: 0,
          students: 0,
          capacity: this.getRoomCapacity(entry.room)
        });
      }

      const room = roomStats.get(roomName)!;
      room.sessions += 1;
      room.students += entry.course.enrollments?.length || 0;
    });

    const roomData = Array.from(roomStats.values())
      .sort((a, b) => (b.students / b.capacity) - (a.students / a.capacity))
      .slice(0, 12) // Top 12 rooms
      .map(room => [
        room.name,
        room.type,
        room.capacity.toString(),
        room.sessions.toString(),
        room.students.toString(),
        `${((room.students / (room.capacity * room.sessions)) * 100).toFixed(1)}%`
      ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Room", "Type", "Capacity", "Sessions", "Students", "Efficiency"]],
      body: roomData,
      theme: 'grid',
      headStyles: { 
        fillColor: [26, 188, 156], 
        textColor: 255, 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold', fontSize: 10 },
        1: { cellWidth: 20, halign: 'center', fontSize: 10 },
        2: { cellWidth: 20, halign: 'center', fontSize: 10 },
        3: { cellWidth: 20, halign: 'center', fontSize: 10 },
        4: { cellWidth: 20, halign: 'center', fontSize: 10 },
        5: { cellWidth: 25, halign: 'center', fontStyle: 'bold', fontSize: 10 }
      }
    });
  }

  // Add professional page header
  private static addPageHeader(doc: jsPDF, pageWidth: number, title: string) {
    doc.setFillColor(52, 73, 94);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 25, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
  }

  // Calculate average utilization
  private static calculateAverageUtilization(entries: TimetableEntry[]): string {
    const enrolledEntries = entries.filter(entry => (entry.course.enrollments?.length || 0) > 0);
    if (enrolledEntries.length === 0) return "0";
    
    const totalUtilization = enrolledEntries.reduce((sum, entry) => {
      const enrollmentCount = entry.course.enrollments?.length || 0;
      const capacityInfo = this.getCapacityInfo(enrollmentCount, entry.room);
      return sum + capacityInfo.utilization;
    }, 0);
    
    return (totalUtilization / enrolledEntries.length).toFixed(1);
  }

  // Get capacity statistics
  private static getCapacityStatistics(entries: TimetableEntry[]) {
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
        const capacityInfo = this.getCapacityInfo(enrollmentCount, entry.room);
        stats[capacityInfo.status.toLowerCase() as keyof typeof stats]++;
      }
    });

    return stats;
  }


}