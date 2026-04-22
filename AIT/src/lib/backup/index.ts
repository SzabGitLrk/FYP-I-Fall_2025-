// Main export file for backup system

// Types and interfaces
export * from './types'
export * from './interfaces'

// Core utilities
export { BackupStorageManager } from './storage'
export { BackupUtils } from './utils'
export { BackupConfigManager, DEFAULT_BACKUP_CONFIG } from './config'

// Services
export { TimetableBackupService } from './backup-service'
export { TimetableRestoreService } from './restore-service'
export { PrismaDatabaseExporter } from './database-exporter'
export { PrismaDatabaseImporter } from './database-importer'
export { BackupArchiveManager } from './archive-manager'
export { BackupValidationService } from './validation-service'

// Constants
export const BACKUP_VERSION = '1.0.0'
export const SUPPORTED_COMPRESSION_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export const DEFAULT_COMPRESSION_LEVEL = 6
export const DEFAULT_RETENTION_COUNT = 10
export const MAX_BACKUP_DESCRIPTION_LENGTH = 255

// Error classes
export class BackupError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'BackupError'
  }
}

export class RestoreError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'RestoreError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class StorageError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'StorageError'
  }
}