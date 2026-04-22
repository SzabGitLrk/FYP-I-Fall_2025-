// IMPROVED Database import service with transaction support

import { prisma } from '@/lib/prisma'
import { DatabaseImporter } from './interfaces'
import { DatabaseSnapshot, ImportResult } from './types'
import { RestoreError } from './index'

export class ImprovedDatabaseImporter implements DatabaseImporter {

  async importFullDatabase(snapshot: DatabaseSnapshot): Promise<ImportResult> {
    const startTime = Date.now()
    const recordsImported: Record<string, number> = {}
    const tablesImported: string[] = []

    try {
      console.log('🔄 Starting full database import with transaction support...')
      console.log(`📊 Importing ${snapshot.metadata.totalRecords} records from ${snapshot.metadata.totalTables} tables`)

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Clear existing data first
        await this.clearDatabaseInTransaction(tx)

        // Import tables in dependency order
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
            const count = await this.importTableDataInTransaction(
              tx, 
              tableName, 
              snapshot.tables[tableName].data
            )
            recordsImported[tableName] = count
            tablesImported.push(tableName)
          }
        }
      }, {
        maxWait: 60000,  // Wait up to 60 seconds to start transaction
        timeout: 300000, // Transaction timeout: 5 minutes
      })

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
      console.log('🗑️ Clearing existing database data with transaction...')

      await prisma.$transaction(async (tx) => {
        await this.clearDatabaseInTransaction(tx)
      })

      console.log('✅ Database cleared successfully')

    } catch (error) {
      console.error('❌ Failed to clear database:', error)
      throw new RestoreError(
        `Failed to clear database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DATABASE_CLEAR_FAILED'
      )
    }
  }

  private async clearDatabaseInTransaction(tx: any): Promise<void> {
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
        const modelName = this.getModelName(tableName)
        await tx[modelName].deleteMany()
        console.log(`🗑️ Cleared table: ${tableName}`)
      } catch (error) {
        console.warn(`⚠️ Could not clear table ${tableName}:`, error)
        // Continue with other tables
      }
    }
  }

  private async importTableDataInTransaction(
    tx: any, 
    tableName: string, 
    data: unknown[]
  ): Promise<number> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return 0
      }

      // Clean data to remove nested relations
      const cleanedData = data.map(record => this.cleanRecordForImport(record))

      let count = 0
      const modelName = this.getModelName(tableName)

      // Import records in batches to avoid memory issues
      const batchSize = 100
      for (let i = 0; i < cleanedData.length; i += batchSize) {
        const batch = cleanedData.slice(i, i + batchSize)
        
        await tx[modelName].createMany({ 
          data: batch, 
          skipDuplicates: true 
        })
        
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

  private getModelName(tableName: string): string {
    const mapping: Record<string, string> = {
      'departments': 'department',
      'programs': 'program',
      'semesters': 'semester',
      'courses': 'course',
      'students': 'student',
      'enrollments': 'enrollment',
      'faculty': 'faculty',
      'rooms': 'room',
      'time_slots': 'timeSlot',
      'timetables': 'timetable',
      'faculty_preferences': 'facultyPreference',
      'room_enhancements': 'roomEnhancement',
      'course_enhancements': 'courseEnhancement',
      'conflict_logs': 'conflictLog',
      'optimization_metrics': 'optimizationMetrics',
      'scenarios': 'scenario',
      'equipment': 'equipment'
    }
    return mapping[tableName] || tableName
  }

  async validateSchema(schema: string): Promise<boolean> {
    try {
      console.log('🔍 Validating schema compatibility...')
      
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

  private cleanRecordForImport(record: any): any {
    if (!record || typeof record !== 'object') {
      return record
    }

    const cleaned = { ...record }

    Object.keys(cleaned).forEach(key => {
      const value = cleaned[key]
      
      // Remove nested objects (relations)
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        delete cleaned[key]
      }
      
      // Remove arrays of objects (relations)
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
