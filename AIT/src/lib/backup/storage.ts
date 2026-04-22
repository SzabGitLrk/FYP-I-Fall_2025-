// Storage management utilities for backup system

import { promises as fs } from 'fs'
import path from 'path'
import { StorageManager, StorageInfo } from './interfaces'

export class BackupStorageManager implements StorageManager {
  private readonly backupDir: string
  private readonly metadataDir: string
  private readonly logsDir: string

  constructor(baseDir: string = 'backups') {
    this.backupDir = path.resolve(baseDir)
    this.metadataDir = path.join(this.backupDir, 'metadata')
    this.logsDir = path.join(this.backupDir, 'logs')
  }

  async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
      await fs.mkdir(this.metadataDir, { recursive: true })
      await fs.mkdir(this.logsDir, { recursive: true })
    } catch (error) {
      throw new Error(`Failed to create backup directories: ${error}`)
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    try {
      await this.ensureBackupDirectory()
      
      const backupFiles = await this.getBackupFiles()
      let totalSize = 0
      let oldestBackup: Date | undefined
      let newestBackup: Date | undefined

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size

        if (!oldestBackup || stats.birthtime < oldestBackup) {
          oldestBackup = stats.birthtime
        }
        if (!newestBackup || stats.birthtime > newestBackup) {
          newestBackup = stats.birthtime
        }
      }

      // Get disk space info (simplified - in production might use statvfs)
      await fs.stat(this.backupDir)
      
      return {
        totalSpace: 0, // Would need platform-specific implementation
        usedSpace: totalSize,
        availableSpace: 0, // Would need platform-specific implementation
        backupCount: backupFiles.length,
        oldestBackup,
        newestBackup
      }
    } catch (error) {
      throw new Error(`Failed to get storage info: ${error}`)
    }
  }

  async cleanupOldBackups(retentionCount: number): Promise<string[]> {
    try {
      const backupFiles = await this.getBackupFiles()
      
      if (backupFiles.length <= retentionCount) {
        return []
      }

      // Sort by creation time (oldest first)
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupDir, file)
          const stats = await fs.stat(filePath)
          return { file, birthtime: stats.birthtime }
        })
      )

      filesWithStats.sort((a, b) => a.birthtime.getTime() - b.birthtime.getTime())
      
      const filesToDelete = filesWithStats.slice(0, filesWithStats.length - retentionCount)
      const deletedFiles: string[] = []

      for (const { file } of filesToDelete) {
        const filePath = path.join(this.backupDir, file)
        await fs.unlink(filePath)
        
        // Also delete associated metadata file
        const backupId = this.extractBackupIdFromFilename(file)
        if (backupId) {
          const metadataPath = path.join(this.metadataDir, `backup-${backupId}.json`)
          try {
            await fs.unlink(metadataPath)
          } catch {
            // Metadata file might not exist, ignore error
          }
        }
        
        deletedFiles.push(file)
      }

      return deletedFiles
    } catch (error) {
      throw new Error(`Failed to cleanup old backups: ${error}`)
    }
  }

  getBackupFilePath(backupId: string): string {
    return path.join(this.backupDir, `backup-${backupId}.backup`)
  }

  getMetadataFilePath(backupId: string): string {
    return path.join(this.metadataDir, `backup-${backupId}.json`)
  }

  getLogFilePath(date: string): string {
    return path.join(this.logsDir, `backup-${date}.log`)
  }

  generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`
  }

  private async getBackupFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir)
      return files.filter(file => file.endsWith('.backup'))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  private extractBackupIdFromFilename(filename: string): string | null {
    const match = filename.match(/^backup-(.+)\.backup$/)
    return match ? match[1] : null
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async readMetadata(backupId: string): Promise<unknown> {
    const metadataPath = this.getMetadataFilePath(backupId)
    const content = await fs.readFile(metadataPath, 'utf-8')
    return JSON.parse(content)
  }

  async writeMetadata(backupId: string, metadata: unknown): Promise<void> {
    const metadataPath = this.getMetadataFilePath(backupId)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  }
}