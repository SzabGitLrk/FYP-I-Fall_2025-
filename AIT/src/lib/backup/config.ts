// Configuration settings for backup system

export interface BackupConfig {
  // Storage settings
  backupDirectory: string
  maxBackupSize: number // in bytes
  defaultRetentionCount: number
  
  // Compression settings
  defaultCompressionLevel: number
  enableCompression: boolean
  
  // Scheduling settings
  enableScheduledBackups: boolean
  defaultSchedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    retentionCount: number
  }
  
  // Validation settings
  enableIntegrityChecks: boolean
  enableCompatibilityChecks: boolean
  
  // Performance settings
  chunkSize: number // for large table processing
  maxConcurrentOperations: number
  operationTimeout: number // in milliseconds
}

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  // Storage settings
  backupDirectory: 'backups',
  maxBackupSize: 1024 * 1024 * 1024, // 1GB
  defaultRetentionCount: 10,
  
  // Compression settings
  defaultCompressionLevel: 6,
  enableCompression: true,
  
  // Scheduling settings
  enableScheduledBackups: false,
  defaultSchedule: {
    frequency: 'daily',
    time: '02:00',
    retentionCount: 7
  },
  
  // Validation settings
  enableIntegrityChecks: true,
  enableCompatibilityChecks: true,
  
  // Performance settings
  chunkSize: 1000, // records per chunk
  maxConcurrentOperations: 3,
  operationTimeout: 30 * 60 * 1000 // 30 minutes
}

export class BackupConfigManager {
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = { ...DEFAULT_BACKUP_CONFIG, ...config }
  }

  getConfig(): BackupConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  getBackupDirectory(): string {
    return this.config.backupDirectory
  }

  getMaxBackupSize(): number {
    return this.config.maxBackupSize
  }

  getDefaultRetentionCount(): number {
    return this.config.defaultRetentionCount
  }

  getCompressionLevel(): number {
    return this.config.defaultCompressionLevel
  }

  isCompressionEnabled(): boolean {
    return this.config.enableCompression
  }

  isScheduledBackupsEnabled(): boolean {
    return this.config.enableScheduledBackups
  }

  getDefaultSchedule() {
    return { ...this.config.defaultSchedule }
  }

  isIntegrityChecksEnabled(): boolean {
    return this.config.enableIntegrityChecks
  }

  isCompatibilityChecksEnabled(): boolean {
    return this.config.enableCompatibilityChecks
  }

  getChunkSize(): number {
    return this.config.chunkSize
  }

  getMaxConcurrentOperations(): number {
    return this.config.maxConcurrentOperations
  }

  getOperationTimeout(): number {
    return this.config.operationTimeout
  }
}