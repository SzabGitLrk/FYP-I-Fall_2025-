// Database import service for restore functionality

import { prisma } from '@/lib/prisma'
import { DatabaseImporter } from './interfaces'
import { DatabaseSnapshot, ImportResult } from './types'
import { RestoreError } from './index'

export class PrismaDatabaseImporter implements DatabaseImporter {

  async importFullDatabase(snapshot: DatabaseSnapshot): Promise<ImportResult> {
    const startTime = Date.now()
    const recordsImported: Record<string, number> = {}
    const tablesImported: string[] = []

    try {
      console.log('🔄 Starting full database import...')
      console.log(`📊 Importing ${snapshot.metadata.totalRecords} records from ${snapshot.metadata.totalTables} tables`)

      // Clear existing data first
      await this.clearDatabase()

      // Import tables in dependency order to maintain referential integrity
      const importOrder = [
        'departments',
        'programs',
        'semesters', 
        'faculty',
        'rooms',
        'time_slots',
        'courses',
        'students',
        'enrollments',
        'timetables',
        'faculty_preferences',
        'room_enhancements',
        'course_enhancements',
        'equipment',
        'conflict_logs',
        'optimization_metrics',
        'scenarios'
      ]

      for (const tableName of importOrder) {
        if (snapshot.tables[tableName]) {
          console.log(`📥 Importing table: ${tableName}`)
          const count = await this.importTableData(tableName, snapshot.tables[tableName].data)
          recordsImported[tableName] = count
          tablesImported.push(tableName)
        }
      }

      const duration = Date.now() - startTime
      const totalImported = Object.values(recordsImported).reduce((sum, count) => sum + count, 0)

      console.log(`✅ Database import completed in ${duration}ms`)
      console.log(`📊 Imported ${totalImported} records across ${tablesImported.length} tables`)

      return {
        tablesImported,
        recordsImported,
        duration
      }

    } catch (error) {
      console.error('❌ Database import failed:', error)
      throw new RestoreError(
        `Database import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DATABASE_IMPORT_FAILED'
      )
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      console.log('🗑️ Clearing existing database data...')

      // Delete in reverse dependency order to avoid foreign key constraints
      const deleteOrder = [
        'scenarios',
        'optimization_metrics', 
        'conflict_logs',
        'equipment',
        'course_enhancements',
        'room_enhancements',
        'faculty_preferences',
        'timetables',
        'enrollments',
        'students',
        'courses',
        'time_slots',
        'rooms',
        'faculty',
        'semesters',
        'programs',
        'departments'
      ]

      for (const tableName of deleteOrder) {
        try {
          switch (tableName) {
            case 'departments':
              await prisma.department.deleteMany()
              break
            case 'programs':
              await prisma.program.deleteMany()
              break
            case 'semesters':
              await prisma.semester.deleteMany()
              break
            case 'courses':
              await prisma.course.deleteMany()
              break
            case 'students':
              await prisma.student.deleteMany()
              break
            case 'enrollments':
              await prisma.enrollment.deleteMany()
              break
            case 'faculty':
              await prisma.faculty.deleteMany()
              break
            case 'rooms':
              await prisma.room.deleteMany()
              break
            case 'time_slots':
              await prisma.timeSlot.deleteMany()
              break
            case 'timetables':
              await prisma.timetable.deleteMany()
              break
            case 'faculty_preferences':
              await prisma.facultyPreference.deleteMany()
              break
            case 'room_enhancements':
              await prisma.roomEnhancement.deleteMany()
              break
            case 'course_enhancements':
              await prisma.courseEnhancement.deleteMany()
              break
            case 'conflict_logs':
              await prisma.conflictLog.deleteMany()
              break
            case 'optimization_metrics':
              await prisma.optimizationMetrics.deleteMany()
              break
            case 'scenarios':
              await prisma.scenario.deleteMany()
              break
            case 'equipment':
              await prisma.equipment.deleteMany()
              break
          }
          console.log(`🗑️ Cleared table: ${tableName}`)
        } catch (error) {
          console.warn(`⚠️ Could not clear table ${tableName}:`, error)
        }
      }

      console.log('✅ Database cleared successfully')

    } catch (error) {
      console.error('❌ Failed to clear database:', error)
      throw new RestoreError(
        `Failed to clear database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DATABASE_CLEAR_FAILED'
      )
    }
  }

  async validateSchema(schema: string): Promise<boolean> {
    try {
      console.log('🔍 Validating schema compatibility...')
      
      // Basic schema validation - check if it contains some expected models
      const expectedModels = [
        'Department', 'Program', 'Course', 'Faculty', 'Room'
      ]

      const hasRequiredModels = expectedModels.some(model => 
        schema.includes(`model ${model}`) || schema.toLowerCase().includes(model.toLowerCase())
      )

      if (!hasRequiredModels) {
        console.warn('⚠️ Schema validation failed: Missing required models')
        return false
      }

      console.log('✅ Schema validation passed')
      return true

    } catch (error) {
      console.error('❌ Schema validation failed:', error)
      return false
    }
  }

  private async importTableData(tableName: string, data: unknown[]): Promise<number> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return 0
      }

      // Clean data to remove nested relations that might cause issues
      const cleanedData = data.map(record => this.cleanRecordForImport(record))

      let count = 0

      // Import records in batches to avoid memory issues
      const batchSize = 100
      for (let i = 0; i < cleanedData.length; i += batchSize) {
        const batch = cleanedData.slice(i, i + batchSize)
        
        switch (tableName) {
          case 'departments':
            await prisma.department.createMany({ data: batch, skipDuplicates: true })
            break
          case 'programs':
            await prisma.program.createMany({ data: batch, skipDuplicates: true })
            break
          case 'semesters':
            await prisma.semester.createMany({ data: batch, skipDuplicates: true })
            break
          case 'courses':
            await prisma.course.createMany({ data: batch, skipDuplicates: true })
            break
          case 'students':
            await prisma.student.createMany({ data: batch, skipDuplicates: true })
            break
          case 'enrollments':
            await prisma.enrollment.createMany({ data: batch, skipDuplicates: true })
            break
          case 'faculty':
            await prisma.faculty.createMany({ data: batch, skipDuplicates: true })
            break
          case 'rooms':
            await prisma.room.createMany({ data: batch, skipDuplicates: true })
            break
          case 'time_slots':
            await prisma.timeSlot.createMany({ data: batch, skipDuplicates: true })
            break
          case 'timetables':
            await prisma.timetable.createMany({ data: batch, skipDuplicates: true })
            break
          case 'faculty_preferences':
            await prisma.facultyPreference.createMany({ data: batch, skipDuplicates: true })
            break
          case 'room_enhancements':
            await prisma.roomEnhancement.createMany({ data: batch, skipDuplicates: true })
            break
          case 'course_enhancements':
            await prisma.courseEnhancement.createMany({ data: batch, skipDuplicates: true })
            break
          case 'conflict_logs':
            await prisma.conflictLog.createMany({ data: batch, skipDuplicates: true })
            break
          case 'optimization_metrics':
            await prisma.optimizationMetrics.createMany({ data: batch, skipDuplicates: true })
            break
          case 'scenarios':
            await prisma.scenario.createMany({ data: batch, skipDuplicates: true })
            break
          case 'equipment':
            await prisma.equipment.createMany({ data: batch, skipDuplicates: true })
            break
          default:
            console.warn(`⚠️ Unknown table: ${tableName}`)
        }
        
        count += batch.length
      }

      return count

    } catch (error) {
      console.error(`❌ Failed to import table ${tableName}:`, error)
      throw new RestoreError(
        `Failed to import table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TABLE_IMPORT_FAILED'
      )
    }
  }

  private cleanRecordForImport(record: any): any {
    if (!record || typeof record !== 'object') {
      return record
    }

    const cleaned = { ...record }

    // Remove nested objects that represent relations
    Object.keys(cleaned).forEach(key => {
      const value = cleaned[key]
      
      // Remove nested objects (relations) but keep primitive values and arrays of primitives
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        delete cleaned[key]
      }
      
      // Remove arrays of objects (relations) but keep arrays of primitives
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        delete cleaned[key]
      }

      // Convert date strings back to Date objects
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        cleaned[key] = new Date(value)
      }
    })

    return cleaned
  }
}