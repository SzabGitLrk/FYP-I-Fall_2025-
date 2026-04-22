// IMPROVED Restore service with automatic rollback

import { RestoreService } from './interfaces'
import { RestoreOptions, RestoreResult, ValidationResult, TestRestoreResult } from './types'
import { BackupValidationService } from './validation-service'
import { ImprovedDatabaseImporter } from './database-importer-improved'
import { BackupArchiveManager } from './archive-manager'
import { BackupStorageManager } from './storage'
import { TimetableBackupService } from './backup-service'
import { RestoreError } from './index'

export class ImprovedRestoreService implements RestoreService {
  private validationService: BackupValidationService
  private databaseImporter: ImprovedDatabaseImporter
  private archiveManager: BackupArchiveManager
  private storageManager: BackupStorageManager
  private backupService: TimetableBackupService

  constructor() {
    this.validationService = new BackupValidationService()
    this.databaseImporter = new ImprovedDatabaseImporter()
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

      // Create pre-restore backup (MANDATORY for safety)
      console.log('💾 Creating pre-restore backup (mandatory for safety)...')
      try {
        const preRestoreResult = await this.backupService.createBackup({
          description: `Pre-restore backup before restoring ${backupId} at ${new Date().toISOString()}`
        })
        preRestoreBackupId = preRestoreResult.backupId
        console.log(`✅ Pre-restore backup created: ${preRestoreBackupId}`)
      } catch (error) {
        console.error('❌ Failed to create pre-restore backup:', error)
        throw new RestoreError(
          'Cannot proceed with restore: Failed to create pre-restore backup for safety',
          'PRE_RESTORE_BACKUP_FAILED'
        )
      }

      // Perform the actual restore
      const result = await this.performRestore(backupId)

      // Verify the restore
      console.log('🔍 Verifying restored data...')
      const verification = await this.verifyRestore(backupId, result)
      
      if (!verification.success) {
        throw new RestoreError(
          `Restore verification failed: ${verification.errors.join(', ')}`,
          'RESTORE_VERIFICATION_FAILED'
        )
      }

      const duration = Date.now() - startTime

      console.log(`✅ Restore completed and verified successfully in ${duration}ms`)
      console.log(`📊 Restored ${Object.values(result.restoredRecords).reduce((sum, count) => sum + count, 0)} records`)

      return {
        success: true,
        preRestoreBackupId,
        restoredRecords: result.restoredRecords,
        duration
      }

    } catch (error) {
      console.error('❌ Restore failed:', error)
      
      // AUTOMATIC ROLLBACK
      if (preRestoreBackupId) {
        console.log(`🔄 Attempting automatic rollback to pre-restore backup: ${preRestoreBackupId}`)
        try {
          await this.performRestore(preRestoreBackupId)
          console.log('✅ Automatic rollback successful - database restored to pre-restore state')
          
          throw new RestoreError(
            `Restore failed but database was automatically rolled back to previous state. ` +
            `Pre-restore backup: ${preRestoreBackupId}. ` +
            `Original error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'RESTORE_FAILED_ROLLED_BACK'
          )
        } catch (rollbackError) {
          console.error('❌ CRITICAL: Automatic rollback also failed!', rollbackError)
          throw new RestoreError(
            `CRITICAL ERROR: Restore failed AND automatic rollback failed! ` +
            `Database may be in inconsistent state. ` +
            `Pre-restore backup ID: ${preRestoreBackupId} - Please restore manually! ` +
            `Original error: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
            `Rollback error: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`,
            'RESTORE_AND_ROLLBACK_FAILED'
          )
        }
      }

      throw new RestoreError(
        `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESTORE_FAILED'
      )
    }
  }

  private async performRestore(backupId: string): Promise<RestoreResult> {
    try {
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

      // Perform database import (with transaction support)
      console.log('📥 Importing database with transaction support...')
      const importResult = await this.databaseImporter.importFullDatabase(backupData.database)

      return {
        success: true,
        restoredRecords: importResult.recordsImported,
        duration: importResult.duration
      }

    } catch (error) {
      throw new RestoreError(
        `Restore operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESTORE_OPERATION_FAILED'
      )
    }
  }

  private async verifyRestore(backupId: string, result: RestoreResult): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Load backup metadata to compare
      const metadata = await this.storageManager.readMetadata(backupId)
      
      // Verify total records
      const totalRestored = Object.values(result.restoredRecords).reduce((sum, count) => sum + count, 0)
      const totalExpected = metadata.totalRecords

      if (totalRestored !== totalExpected) {
        errors.push(
          `Total records mismatch: Expected ${totalExpected}, restored ${totalRestored}`
        )
      }

      // Verify table counts
      const backupPath = this.storageManager.getBackupFilePath(backupId)
      const backupData = await this.archiveManager.extractArchive(backupPath)

      for (const [tableName, tableData] of Object.entries(backupData.database.tables)) {
        const expectedCount = tableData.rowCount
        const actualCount = result.restoredRecords[tableName] || 0

        if (actualCount !== expectedCount) {
          errors.push(
            `Table ${tableName}: Expected ${expectedCount} records, restored ${actualCount}`
          )
        }
      }

      if (errors.length > 0) {
        console.error('❌ Restore verification failed:', errors)
      } else {
        console.log('✅ Restore verification passed')
      }

    } catch (error) {
      errors.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  async validateBackup(backupId: string): Promise<ValidationResult> {
    try {
      console.log(`🔍 Validating backup: ${backupId}`)

      const integrityResult = await this.validationService.validateBackupIntegrity(backupId)
      
      if (!integrityResult.isValid) {
        return integrityResult
      }

      const compatibilityResult = await this.validationService.validateBackupCompatibility(backupId)

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
