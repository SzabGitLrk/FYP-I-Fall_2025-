// Database export service for backup system

import { prisma } from '@/lib/prisma'
import { DatabaseExporter } from './interfaces'
import { DatabaseSnapshot, TableData, DatabaseMetadata } from './types'
import { BackupUtils } from './utils'

export class PrismaDatabaseExporter implements DatabaseExporter {
  
  async exportFullDatabase(): Promise<DatabaseSnapshot> {
    try {
      console.log('🔄 Starting full database export...')
      
      // Get all table names from Prisma schema
      const tableNames = [
        'departments',
        'programs', 
        'semesters',
        'courses',
        'students',
        'enrollments',
        'faculty',
        'rooms',
        'time_slots',
        'timetables',
        'faculty_preferences',
        'room_enhancements',
        'course_enhancements',
        'conflict_logs',
        'optimization_metrics',
        'scenarios',
        'equipment'
      ]

      const tables: Record<string, TableData> = {}
      let totalRecords = 0

      // Export each table
      for (const tableName of tableNames) {
        console.log(`📊 Exporting table: ${tableName}`)
        const tableData = await this.exportTableData(tableName)
        tables[tableName] = tableData
        totalRecords += tableData.rowCount
      }

      // Get schema information
      const schema = await this.getSchemaDefinition()
      
      // Create metadata
      const metadata: DatabaseMetadata = {
        version: '1.0.0',
        exportedAt: new Date(),
        totalTables: tableNames.length,
        totalRecords
      }

      // Create snapshot
      const snapshot: DatabaseSnapshot = {
        schema,
        tables,
        metadata,
        checksum: ''
      }

      // Generate checksum for the entire snapshot (excluding the checksum field itself)
      const snapshotForChecksum = { ...snapshot }
      delete snapshotForChecksum.checksum
      snapshot.checksum = this.generateChecksum(snapshotForChecksum)

      console.log(`✅ Database export completed: ${totalRecords} records from ${tableNames.length} tables`)
      
      return snapshot
    } catch (error) {
      console.error('❌ Database export failed:', error)
      throw new Error(`Database export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }  
async exportTableData(tableName: string): Promise<TableData> {
    try {
      let data: unknown[] = []
      
      // Use Prisma to export data from each table
      switch (tableName) {
        case 'departments':
          data = await prisma.department.findMany({
            include: {
              programs: true,
              faculty: true
            }
          })
          break
        case 'programs':
          data = await prisma.program.findMany({
            include: {
              department: true,
              semesters: true,
              students: true
            }
          })
          break
        case 'semesters':
          data = await prisma.semester.findMany({
            include: {
              program: true,
              courses: true,
              students: true
            }
          })
          break
        case 'courses':
          data = await prisma.course.findMany({
            include: {
              semester: true,
              faculty: true,
              timetable: true,
              enhancement: true,
              enrollments: true
            }
          })
          break
        case 'students':
          data = await prisma.student.findMany({
            include: {
              program: true,
              semester: true,
              enrollments: true
            }
          })
          break
        case 'enrollments':
          data = await prisma.enrollment.findMany({
            include: {
              student: true,
              course: true
            }
          })
          break
        case 'faculty':
          data = await prisma.faculty.findMany({
            include: {
              department: true,
              courses: true,
              timetable: true,
              preferences: true
            }
          })
          break
        case 'rooms':
          data = await prisma.room.findMany({
            include: {
              timetable: true,
              enhancement: true
            }
          })
          break
        case 'time_slots':
          data = await prisma.timeSlot.findMany({
            include: {
              timetable: true
            }
          })
          break
        case 'timetables':
          data = await prisma.timetable.findMany({
            include: {
              course: true,
              room: true,
              faculty: true,
              timeslot: true
            }
          })
          break
        case 'faculty_preferences':
          data = await prisma.facultyPreference.findMany({
            include: {
              faculty: true
            }
          })
          break
        case 'room_enhancements':
          data = await prisma.roomEnhancement.findMany({
            include: {
              room: true
            }
          })
          break
        case 'course_enhancements':
          data = await prisma.courseEnhancement.findMany({
            include: {
              course: true
            }
          })
          break
        case 'conflict_logs':
          data = await prisma.conflictLog.findMany()
          break
        case 'optimization_metrics':
          data = await prisma.optimizationMetrics.findMany()
          break
        case 'scenarios':
          data = await prisma.scenario.findMany({
            include: {
              parentScenario: true,
              childScenarios: true
            }
          })
          break
        case 'equipment':
          data = await prisma.equipment.findMany()
          break
        default:
          throw new Error(`Unknown table: ${tableName}`)
      }

      const tableData: TableData = {
        name: tableName,
        data,
        rowCount: data.length,
        checksum: this.generateChecksum(data)
      }

      return tableData
    } catch (error) {
      console.error(`❌ Failed to export table ${tableName}:`, error)
      throw new Error(`Failed to export table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  generateChecksum(data: unknown): string {
    return BackupUtils.generateChecksum(data)
  }

  private async getSchemaDefinition(): Promise<string> {
    try {
      // In a real implementation, you might read the schema.prisma file
      // For now, we'll return a basic schema identifier
      return `
        // Prisma Schema for AI Timetable Generator
        // Generated at: ${new Date().toISOString()}
        // Version: 1.0.0
        
        generator client {
          provider = "prisma-client-js"
        }
        
        datasource db {
          provider = "sqlite"
          url      = "file:./dev.db"
        }
        
        // Schema includes: departments, programs, semesters, courses, students,
        // enrollments, faculty, rooms, time_slots, timetables, faculty_preferences,
        // room_enhancements, course_enhancements, conflict_logs, optimization_metrics,
        // scenarios, equipment
      `
    } catch (error) {
      console.error('❌ Failed to get schema definition:', error)
      return '// Schema definition unavailable'
    }
  }
}