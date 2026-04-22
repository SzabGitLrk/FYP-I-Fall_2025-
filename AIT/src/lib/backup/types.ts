// Core backup system types and interfaces

export interface BackupOptions {
  description?: string
  includeMetrics?: boolean
  compressionLevel?: number
}

export interface BackupResult {
  backupId: string
  filePath: string
  size: number
  checksum: string
  createdAt: Date
}

export interface BackupInfo {
  id: string
  filePath: string
  size: number
  checksum: string
  createdAt: Date
  description?: string
  metadata: BackupMetadata
}

export interface BackupMetadata {
  id: string
  version: string
  createdAt: Date
  description?: string
  applicationVersion: string
  databaseVersion: string
  
  // Statistics
  totalTables: number
  totalRecords: number
  fileSize: number
  
  // Checksums for integrity
  databaseChecksum: string
  metadataChecksum: string
  archiveChecksum: string
  
  // Compatibility info
  schemaVersion: string
  prismaVersion: string
  nodeVersion: string
}

export interface BackupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  retentionCount: number
  enabled: boolean
}

export interface RestoreOptions {
  createPreRestoreBackup?: boolean
  skipValidation?: boolean
}

export interface RestoreResult {
  success: boolean
  preRestoreBackupId?: string
  restoredRecords: Record<string, number>
  duration: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: BackupMetadata
}

export interface TestRestoreResult {
  success: boolean
  errors: string[]
  testDuration: number
  recordsValidated: Record<string, number>
}

export interface DatabaseSnapshot {
  schema: string
  tables: Record<string, TableData>
  metadata: DatabaseMetadata
  checksum: string
}

export interface TableData {
  name: string
  data: unknown[]
  rowCount: number
  checksum: string
}

export interface DatabaseMetadata {
  version: string
  exportedAt: Date
  totalTables: number
  totalRecords: number
}

export interface ImportResult {
  tablesImported: string[]
  recordsImported: Record<string, number>
  duration: number
}

export interface BackupData {
  database: DatabaseSnapshot
  metadata: BackupMetadata
  version: string
}

export interface BackupProgress {
  stage: 'exporting' | 'compressing' | 'finalizing'
  progress: number
  message: string
}

export interface RestoreProgress {
  stage: 'validating' | 'backing_up' | 'importing' | 'finalizing'
  progress: number
  message: string
}