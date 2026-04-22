// Core service interfaces for backup system

import {
  BackupOptions,
  BackupResult,
  BackupInfo,
  BackupSchedule,
  RestoreOptions,
  RestoreResult,
  ValidationResult,
  TestRestoreResult,
  DatabaseSnapshot,
  TableData,
  ImportResult,
  BackupData
} from './types'

export interface BackupService {
  createBackup(options: BackupOptions): Promise<BackupResult>
  listBackups(): Promise<BackupInfo[]>
  deleteBackup(backupId: string): Promise<void>
  downloadBackup(backupId: string): Promise<Buffer>
  scheduleBackup(schedule: BackupSchedule): Promise<void>
  getBackupInfo(backupId: string): Promise<BackupInfo>
}

export interface RestoreService {
  restoreFromBackup(backupId: string, options: RestoreOptions): Promise<RestoreResult>
  validateBackup(backupId: string): Promise<ValidationResult>
  testRestore(backupId: string): Promise<TestRestoreResult>
}

export interface DatabaseExporter {
  exportFullDatabase(): Promise<DatabaseSnapshot>
  exportTableData(tableName: string): Promise<TableData>
  generateChecksum(data: unknown): string
}

export interface DatabaseImporter {
  importFullDatabase(snapshot: DatabaseSnapshot): Promise<ImportResult>
  clearDatabase(): Promise<void>
  validateSchema(schema: string): Promise<boolean>
}

export interface ArchiveManager {
  createArchive(data: BackupData): Promise<string>
  extractArchive(filePath: string): Promise<BackupData>
  validateArchive(filePath: string): Promise<boolean>
  compressData(data: unknown, level: number): Promise<Buffer>
}

export interface ValidationService {
  validateBackupIntegrity(backupId: string): Promise<ValidationResult>
  validateBackupCompatibility(backupId: string): Promise<ValidationResult>
  generateValidationReport(backupId: string): Promise<string>
}

export interface SchedulerService {
  configureSchedule(schedule: BackupSchedule): Promise<void>
  executeScheduledBackup(): Promise<BackupResult>
  getScheduleStatus(): Promise<BackupSchedule | null>
  disableSchedule(): Promise<void>
}

export interface StorageManager {
  ensureBackupDirectory(): Promise<void>
  getStorageInfo(): Promise<StorageInfo>
  cleanupOldBackups(retentionCount: number): Promise<string[]>
  getBackupFilePath(backupId: string): string
  generateBackupId(): string
}

export interface StorageInfo {
  totalSpace: number
  usedSpace: number
  availableSpace: number
  backupCount: number
  oldestBackup?: Date
  newestBackup?: Date
}