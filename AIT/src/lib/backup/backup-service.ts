// Main backup service implementation

import { promises as fs } from 'fs'
import { BackupService } from './interfaces'
import { BackupOptions, BackupResult, BackupInfo, BackupSchedule, BackupData, BackupMetadata } from './types'
import { PrismaDatabaseExporter } from './database-exporter'
import { BackupArchiveManager } from './archive-manager'
import { BackupStorageManager } from './storage'
import { BackupUtils } from './utils'
import { BackupError } from './index'

export class TimetableBackupService implements BackupService {
  private databaseExporter: PrismaDatabaseExporter
  private archiveManager: BackupArchiveManager
  private storageManager: BackupStorageManager

  constructor() {
    this.databaseExporter = new PrismaDatabaseExporter()
    this.archiveManager = new BackupArchiveManager()
    this.storageManager = new BackupStorageManager()
  }

  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Starting backup creation...')
      
      // Ensure backup directory exists
      await this.storageManager.ensureBackupDirectory()
      
      // Generate backup ID
      const backupId = this.storageManager.generateBackupId()
      
      // Export database
      console.log('📊 Exporting database...')
      const databaseSnapshot = await this.databaseExporter.exportFullDatabase()
      
      // Create metadata
      const metadata: BackupMetadata = BackupUtils.generateMetadata(
        backupId,
        options.description,
        {
          totalTables: databaseSnapshot.metadata.totalTables,
          totalRecords: databaseSnapshot.metadata.totalRecords
        }
      )
      
      // Update metadata with database checksum
      metadata.databaseChecksum = databaseSnapshot.checksum
      
      // Create backup data structure
      const backupData: BackupData = {
        version: '1.0.0',
        metadata,
        database: databaseSnapshot
      }
      
      // Create archive
      console.log('🗜️ Creating compressed archive...')
      const tempArchivePath = await this.archiveManager.createArchive(backupData)
      
      // Get file size and update metadata
      const stats = await fs.stat(tempArchivePath)
      metadata.fileSize = stats.size
      metadata.archiveChecksum = BackupUtils.generateChecksum(await fs.readFile(tempArchivePath))
      
      // Calculate metadata checksum (excluding checksum fields)
      const metadataForChecksum = { ...metadata }
      delete metadataForChecksum.metadataChecksum
      delete metadataForChecksum.archiveChecksum
      metadata.metadataChecksum = BackupUtils.generateChecksum(metadataForChecksum)
      
      // Move archive to final location
      const finalPath = this.storageManager.getBackupFilePath(backupId)
      await fs.rename(tempArchivePath, finalPath)
      
      // Save metadata
      await this.storageManager.writeMetadata(backupId, metadata)
      
      const duration = Date.now() - startTime
      
      console.log(`✅ Backup created successfully in ${BackupUtils.formatDuration(duration)}`)
      console.log(`📁 File: ${finalPath}`)
      console.log(`📊 Size: ${BackupUtils.formatFileSize(metadata.fileSize)}`)
      console.log(`🔢 Records: ${metadata.totalRecords} from ${metadata.totalTables} tables`)
      
      return {
        backupId,
        filePath: finalPath,
        size: metadata.fileSize,
        checksum: metadata.archiveChecksum,
        createdAt: metadata.createdAt
      }
    } catch (error) {
      console.error('❌ Backup creation failed:', error)
      throw new BackupError(
        `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_CREATION_FAILED'
      )
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      console.log('📋 Listing available backups...')
      
      await this.storageManager.ensureBackupDirectory()
      
      // Get all backup files
      const backupFiles = await fs.readdir(this.storageManager.getBackupFilePath('').replace('/backup-.backup', ''))
      const backupInfos: BackupInfo[] = []
      
      for (const file of backupFiles) {
        if (file.endsWith('.backup')) {
          const backupId = BackupUtils.extractBackupId(file)
          if (backupId) {
            try {
              const metadata = await this.storageManager.readMetadata(backupId) as BackupMetadata
              const filePath = this.storageManager.getBackupFilePath(backupId)
              
              backupInfos.push({
                id: backupId,
                filePath,
                size: metadata.fileSize,
                checksum: metadata.archiveChecksum,
                createdAt: new Date(metadata.createdAt),
                description: metadata.description,
                metadata
              })
            } catch (error) {
              console.warn(`⚠️ Could not read metadata for backup ${backupId}:`, error)
            }
          }
        }
      }
      
      // Sort by creation date (newest first)
      backupInfos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      console.log(`📋 Found ${backupInfos.length} backups`)
      
      return backupInfos
    } catch (error) {
      console.error('❌ Failed to list backups:', error)
      throw new BackupError(
        `Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_LIST_FAILED'
      )
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting backup: ${backupId}`)
      
      if (!BackupUtils.isValidBackupId(backupId)) {
        throw new Error('Invalid backup ID format')
      }
      
      const backupPath = this.storageManager.getBackupFilePath(backupId)
      const metadataPath = this.storageManager.getMetadataFilePath(backupId)
      
      // Delete backup file
      await fs.unlink(backupPath)
      
      // Delete metadata file
      try {
        await fs.unlink(metadataPath)
      } catch (error) {
        console.warn(`⚠️ Could not delete metadata file: ${error}`)
      }
      
      console.log(`✅ Backup deleted: ${backupId}`)
    } catch (error) {
      console.error('❌ Failed to delete backup:', error)
      throw new BackupError(
        `Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_DELETE_FAILED'
      )
    }
  }

  async downloadBackup(backupId: string): Promise<Buffer> {
    try {
      console.log(`📥 Preparing backup download: ${backupId}`)
      
      if (!BackupUtils.isValidBackupId(backupId)) {
        throw new Error('Invalid backup ID format')
      }
      
      const backupPath = this.storageManager.getBackupFilePath(backupId)
      const buffer = await fs.readFile(backupPath)
      
      console.log(`✅ Backup ready for download: ${BackupUtils.formatFileSize(buffer.length)}`)
      
      return buffer
    } catch (error) {
      console.error('❌ Failed to prepare backup download:', error)
      throw new BackupError(
        `Failed to prepare backup download: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_DOWNLOAD_FAILED'
      )
    }
  }

  async getBackupInfo(backupId: string): Promise<BackupInfo> {
    try {
      if (!BackupUtils.isValidBackupId(backupId)) {
        throw new Error('Invalid backup ID format')
      }
      
      const metadata = await this.storageManager.readMetadata(backupId) as BackupMetadata
      const filePath = this.storageManager.getBackupFilePath(backupId)
      
      return {
        id: backupId,
        filePath,
        size: metadata.fileSize,
        checksum: metadata.archiveChecksum,
        createdAt: new Date(metadata.createdAt),
        description: metadata.description,
        metadata
      }
    } catch (error) {
      throw new BackupError(
        `Failed to get backup info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_INFO_FAILED'
      )
    }
  }

  async scheduleBackup(schedule: BackupSchedule): Promise<void> {
    // TODO: Implement scheduling functionality in Task 6
    console.log('📅 Backup scheduling will be implemented in Task 6')
    throw new Error('Backup scheduling not yet implemented')
  }
}