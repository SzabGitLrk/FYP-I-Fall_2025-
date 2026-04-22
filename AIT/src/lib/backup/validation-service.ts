// Backup validation service

import { ValidationService } from './interfaces'
import { ValidationResult, BackupMetadata } from './types'
import { BackupStorageManager } from './storage'
import { BackupArchiveManager } from './archive-manager'
import { BackupUtils } from './utils'
import { ValidationError } from './index'

export class BackupValidationService implements ValidationService {
  private storageManager: BackupStorageManager
  private archiveManager: BackupArchiveManager

  constructor() {
    this.storageManager = new BackupStorageManager()
    this.archiveManager = new BackupArchiveManager()
  }

  async validateBackupIntegrity(backupId: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      console.log(`🔍 Validating backup integrity: ${backupId}`)

      // Validate backup ID format
      if (!BackupUtils.isValidBackupId(backupId)) {
        errors.push('Invalid backup ID format')
        return { isValid: false, errors, warnings }
      }

      // Check if backup file exists
      const backupPath = this.storageManager.getBackupFilePath(backupId)
      const fileExists = await this.storageManager.fileExists(backupPath)
      
      if (!fileExists) {
        errors.push('Backup file not found')
        return { isValid: false, errors, warnings }
      }

      // Read and validate metadata
      let metadata: BackupMetadata
      try {
        metadata = await this.storageManager.readMetadata(backupId) as BackupMetadata
      } catch (error) {
        errors.push('Could not read backup metadata')
        return { isValid: false, errors, warnings }
      }

      // Validate metadata structure
      const metadataValidation = BackupUtils.validateMetadata(metadata)
      if (!metadataValidation.isValid) {
        errors.push(...metadataValidation.errors)
      }

      // Validate archive integrity
      const archiveValid = await this.archiveManager.validateArchive(backupPath)
      if (!archiveValid) {
        errors.push('Archive file is corrupted or invalid')
      }

      // Validate checksums if archive is readable
      if (archiveValid) {
        try {
          const backupData = await this.archiveManager.extractArchive(backupPath)
          
          // Validate database checksum
          const databaseForChecksum = { ...backupData.database }
          delete databaseForChecksum.checksum // Remove checksum field before calculating
          const calculatedDbChecksum = BackupUtils.generateChecksum(databaseForChecksum)
          if (calculatedDbChecksum !== metadata.databaseChecksum) {
            warnings.push('Database checksum mismatch - this may be due to checksum calculation differences')
          }

          // Validate metadata checksum
          const metadataForChecksum = { ...metadata }
          delete metadataForChecksum.metadataChecksum
          delete metadataForChecksum.archiveChecksum
          const calculatedMetaChecksum = BackupUtils.generateChecksum(metadataForChecksum)
          if (calculatedMetaChecksum !== metadata.metadataChecksum) {
            warnings.push('Metadata checksum mismatch - metadata may have been modified')
          }

          // Validate table data
          for (const [tableName, tableData] of Object.entries(backupData.database.tables)) {
            const calculatedTableChecksum = BackupUtils.generateChecksum(tableData.data)
            if (calculatedTableChecksum !== tableData.checksum) {
              errors.push(`Table ${tableName} checksum mismatch - data may be corrupted`)
            }
          }

        } catch (error) {
          errors.push(`Failed to validate backup contents: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      const isValid = errors.length === 0
      
      console.log(`✅ Backup validation completed: ${isValid ? 'PASSED' : 'FAILED'}`)
      if (errors.length > 0) {
        console.log(`❌ Errors: ${errors.join(', ')}`)
      }
      if (warnings.length > 0) {
        console.log(`⚠️ Warnings: ${warnings.join(', ')}`)
      }

      return {
        isValid,
        errors,
        warnings,
        metadata
      }

    } catch (error) {
      console.error('❌ Backup validation failed:', error)
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { isValid: false, errors, warnings }
    }
  }

  async validateBackupCompatibility(backupId: string): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      console.log(`🔍 Validating backup compatibility: ${backupId}`)

      // First validate integrity
      const integrityResult = await this.validateBackupIntegrity(backupId)
      if (!integrityResult.isValid) {
        return integrityResult
      }

      const metadata = integrityResult.metadata!

      // Check application version compatibility
      const currentAppVersion = process.env.npm_package_version || '1.0.0'
      if (metadata.applicationVersion !== currentAppVersion) {
        warnings.push(`Backup created with different application version (${metadata.applicationVersion} vs ${currentAppVersion})`)
      }

      // Check Prisma version compatibility
      const currentPrismaVersion = process.env.npm_package_dependencies_prisma || '5.0.0'
      if (metadata.prismaVersion !== currentPrismaVersion) {
        warnings.push(`Backup created with different Prisma version (${metadata.prismaVersion} vs ${currentPrismaVersion})`)
      }

      // Check Node.js version compatibility
      const currentNodeVersion = process.version
      if (metadata.nodeVersion !== currentNodeVersion) {
        warnings.push(`Backup created with different Node.js version (${metadata.nodeVersion} vs ${currentNodeVersion})`)
      }

      // Check backup age
      const createdAt = new Date(metadata.createdAt)
      const backupAge = Date.now() - createdAt.getTime()
      const daysSinceBackup = backupAge / (1000 * 60 * 60 * 24)
      
      if (daysSinceBackup > 30) {
        warnings.push(`Backup is ${Math.floor(daysSinceBackup)} days old - consider creating a fresh backup`)
      }

      // Check if backup is too recent (might indicate rapid backup creation)
      if (daysSinceBackup < 0.01) { // Less than ~15 minutes
        warnings.push('Backup was created very recently - ensure it completed successfully')
      }

      const isValid = errors.length === 0

      console.log(`✅ Compatibility validation completed: ${isValid ? 'PASSED' : 'FAILED'}`)
      if (warnings.length > 0) {
        console.log(`⚠️ Compatibility warnings: ${warnings.join(', ')}`)
      }

      return {
        isValid,
        errors,
        warnings,
        metadata
      }

    } catch (error) {
      console.error('❌ Compatibility validation failed:', error)
      errors.push(`Compatibility validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { isValid: false, errors, warnings }
    }
  }

  async generateValidationReport(backupId: string): Promise<string> {
    try {
      console.log(`📋 Generating validation report for: ${backupId}`)

      const integrityResult = await this.validateBackupIntegrity(backupId)
      const compatibilityResult = await this.validateBackupCompatibility(backupId)

      const report = `
# Backup Validation Report

**Backup ID:** ${backupId}
**Generated:** ${new Date().toISOString()}

## Integrity Validation
**Status:** ${integrityResult.isValid ? '✅ PASSED' : '❌ FAILED'}

${integrityResult.errors.length > 0 ? `
### Errors
${integrityResult.errors.map(error => `- ${error}`).join('\n')}
` : ''}

${integrityResult.warnings.length > 0 ? `
### Warnings  
${integrityResult.warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

## Compatibility Validation
**Status:** ${compatibilityResult.isValid ? '✅ PASSED' : '❌ FAILED'}

${compatibilityResult.errors.length > 0 ? `
### Errors
${compatibilityResult.errors.map(error => `- ${error}`).join('\n')}
` : ''}

${compatibilityResult.warnings.length > 0 ? `
### Warnings
${compatibilityResult.warnings.map(warning => `- ${warning}`).join('\n')}
` : ''}

${integrityResult.metadata ? `
## Backup Metadata
- **Version:** ${integrityResult.metadata.version}
- **Created:** ${integrityResult.metadata.createdAt}
- **Description:** ${integrityResult.metadata.description || 'No description'}
- **Application Version:** ${integrityResult.metadata.applicationVersion}
- **Database Version:** ${integrityResult.metadata.databaseVersion}
- **Total Tables:** ${integrityResult.metadata.totalTables}
- **Total Records:** ${integrityResult.metadata.totalRecords}
- **File Size:** ${BackupUtils.formatFileSize(integrityResult.metadata.fileSize)}
- **Schema Version:** ${integrityResult.metadata.schemaVersion}
- **Prisma Version:** ${integrityResult.metadata.prismaVersion}
- **Node Version:** ${integrityResult.metadata.nodeVersion}
` : ''}

## Overall Assessment
${integrityResult.isValid && compatibilityResult.isValid 
  ? '✅ This backup is valid and compatible for restoration.' 
  : '❌ This backup has issues that should be resolved before restoration.'}
      `.trim()

      console.log('✅ Validation report generated')
      return report

    } catch (error) {
      console.error('❌ Failed to generate validation report:', error)
      throw new ValidationError(
        `Failed to generate validation report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_REPORT_FAILED'
      )
    }
  }
}