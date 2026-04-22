// Restore service implementation

import { RestoreService } from './interfaces'
import { RestoreOptions, RestoreResult, ValidationResult, TestRestoreResult } from './types'
import { BackupValidationService } from './validation-service'
import { PrismaDatabaseImporter } from './database-importer'
import { BackupArchiveManager } from './archive-manager'
import { BackupStorageManager } from './storage'
import { TimetableBackupService } from './backup-service'
import { RestoreError } from './index'

export class TimetableRestoreService implements RestoreService {
  private validationService: BackupValidationService
  private databaseImporter: PrismaDatabaseImporter
  private archiveManager: BackupArchiveManager
  private storageManager: BackupStorageManager
  private backupService: TimetableBackupService

  constructor() {
    this.validationService = new BackupValidationService()
    this.databaseImporter = new PrismaDatabaseImporter()
    this.archiveManager = new BackupArchiveManager()
    this.storageManager = new BackupStorageManager()
    this.backupService = new TimetableBackupService()
  }

  async restoreFromBackup(backupId: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    const startTime = Date.now()
    let preRestoreBackupId: string | undefined

    try {
      console.log(`🔄 Starting restore from backup: ${backupId}`)

      // Validate backup first (unless skipped)
      if (!options.skipValidation) {
        console.log('🔍 Validating backup before restore...')
        const validation = await this.validateBackup(backupId)
        
        if (!validation.isValid) {
          throw new RestoreError(
            `Backup validation failed: ${validation.errors.join(', ')}`,
            'BACKUP_VALIDATION_FAILED'
          )
        }

        if (validation.warnings.length > 0) {
          console.warn('⚠️ Backup validation warnings:', validation.warnings.join(', '))
        }
      }

      // Create pre-restore backup (unless disabled)
      if (options.createPreRestoreBackup !== false) {
        console.log('💾 Creating pre-restore backup...')
        try {
          const preRestoreResult = await this.backupService.createBackup({
            description: `Pre-restore backup before restoring ${backupId}`
          })
          preRestoreBackupId = preRestoreResult.backupId
          console.log(`✅ Pre-restore backup created: ${preRestoreBackupId}`)
        } catch (error) {
          console.warn('⚠️ Failed to create pre-restore backup:', error)
          // Continue with restore even if pre-restore backup fails
        }
      }

      // Load backup data
      console.log('📦 Loading backup data...')
      const backupPath = this.storageManager.getBackupFilePath(backupId)
      const backupData = await this.archiveManager.extractArchive(backupPath)

      // Validate schema compatibility
      const schemaValid = await this.databaseImporter.validateSchema(backupData.database.schema)
      if (!schemaValid) {
        throw new RestoreError(
          'Backup schema is not compatible with current database structure',
          'SCHEMA_INCOMPATIBLE'
        )
      }

      // Perform database import
      console.log('📥 Importing database...')
      const importResult = await this.databaseImporter.importFullDatabase(backupData.database)

      const duration = Date.now() - startTime

      console.log(`✅ Restore completed successfully in ${duration}ms`)
      console.log(`📊 Restored ${Object.values(importResult.recordsImported).reduce((sum, count) => sum + count, 0)} records`)

      return {
        success: true,
        preRestoreBackupId,
        restoredRecords: importResult.recordsImported,
        duration
      }

    } catch (error) {
      console.error('❌ Restore failed:', error)
      
      // If we have a pre-restore backup and the restore failed, we could offer to restore from it
      if (preRestoreBackupId) {
        console.log(`💡 Pre-restore backup available for rollback: ${preRestoreBackupId}`)
      }

      throw new RestoreError(
        `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESTORE_FAILED'
      )
    }
  }

  async validateBackup(backupId: string): Promise<ValidationResult> {
    try {
      console.log(`🔍 Validating backup: ${backupId}`)

      // Perform both integrity and compatibility validation
      const integrityResult = await this.validationService.validateBackupIntegrity(backupId)
      
      if (!integrityResult.isValid) {
        return integrityResult
      }

      const compatibilityResult = await this.validationService.validateBackupCompatibility(backupId)

      // Combine results
      const combinedResult: ValidationResult = {
        isValid: integrityResult.isValid && compatibilityResult.isValid,
        errors: [...integrityResult.errors, ...compatibilityResult.errors],
        warnings: [...integrityResult.warnings, ...compatibilityResult.warnings],
        metadata: integrityResult.metadata
      }

      console.log(`✅ Backup validation completed: ${combinedResult.isValid ? 'PASSED' : 'FAILED'}`)

      return combinedResult

    } catch (error) {
      console.error('❌ Backup validation failed:', error)
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      }
    }
  }

  async testRestore(backupId: string): Promise<TestRestoreResult> {
    const startTime = Date.now()

    try {
      console.log(`🧪 Testing restore for backup: ${backupId}`)

      // Validate backup
      const validation = await this.validateBackup(backupId)
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          testDuration: Date.now() - startTime,
          recordsValidated: {}
        }
      }

      // Load and validate backup data structure
      const backupPath = this.storageManager.getBackupFilePath(backupId)
      const backupData = await this.archiveManager.extractArchive(backupPath)

      // Validate schema
      const schemaValid = await this.databaseImporter.validateSchema(backupData.database.schema)
      if (!schemaValid) {
        return {
          success: false,
          errors: ['Schema compatibility check failed'],
          testDuration: Date.now() - startTime,
          recordsValidated: {}
        }
      }

      // Count records that would be restored
      const recordsValidated: Record<string, number> = {}
      for (const [tableName, tableData] of Object.entries(backupData.database.tables)) {
        recordsValidated[tableName] = tableData.rowCount
      }

      const testDuration = Date.now() - startTime

      console.log(`✅ Test restore completed successfully in ${testDuration}ms`)
      console.log(`📊 Would restore ${Object.values(recordsValidated).reduce((sum, count) => sum + count, 0)} records`)

      return {
        success: true,
        errors: [],
        testDuration,
        recordsValidated
      }

    } catch (error) {
      console.error('❌ Test restore failed:', error)
      return {
        success: false,
        errors: [`Test restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        testDuration: Date.now() - startTime,
        recordsValidated: {}
      }
    }
  }
}