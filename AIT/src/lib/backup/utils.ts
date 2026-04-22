// Utility functions for backup system

import crypto from 'crypto'
import { BackupMetadata } from './types'

export class BackupUtils {
  /**
   * Generate SHA-256 checksum for data
   */
  static generateChecksum(data: unknown): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data)
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Generate backup metadata
   */
  static generateMetadata(
    backupId: string,
    description?: string,
    databaseStats?: { totalTables: number; totalRecords: number }
  ): BackupMetadata {
    return {
      id: backupId,
      version: '1.0.0',
      createdAt: new Date(),
      description,
      applicationVersion: process.env.npm_package_version || '1.0.0',
      databaseVersion: '1.0.0',
      totalTables: databaseStats?.totalTables || 0,
      totalRecords: databaseStats?.totalRecords || 0,
      fileSize: 0, // Will be updated after compression
      databaseChecksum: '',
      metadataChecksum: '',
      archiveChecksum: '',
      schemaVersion: '1.0.0',
      prismaVersion: process.env.npm_package_dependencies_prisma || '5.0.0',
      nodeVersion: process.version
    }
  }

  /**
   * Validate backup ID format
   */
  static isValidBackupId(backupId: string): boolean {
    // Format: YYYY-MM-DDTHH-MM-SS-sssZ-random
    const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-z0-9]{6}$/
    return pattern.test(backupId)
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * Format duration in human readable format
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Validate backup metadata structure
   */
  static validateMetadata(metadata: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!metadata.id) errors.push('Missing backup ID')
    if (!metadata.version) errors.push('Missing version')
    if (!metadata.createdAt) errors.push('Missing creation date')
    if (!metadata.applicationVersion) errors.push('Missing application version')
    if (!metadata.databaseChecksum) errors.push('Missing database checksum')
    if (!metadata.archiveChecksum) errors.push('Missing archive checksum')

    if (typeof metadata.totalTables !== 'number') {
      errors.push('Invalid total tables count')
    }
    if (typeof metadata.totalRecords !== 'number') {
      errors.push('Invalid total records count')
    }
    if (typeof metadata.fileSize !== 'number') {
      errors.push('Invalid file size')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Create backup filename from ID
   */
  static getBackupFilename(backupId: string): string {
    return `backup-${backupId}.backup`
  }

  /**
   * Extract backup ID from filename
   */
  static extractBackupId(filename: string): string | null {
    const match = filename.match(/^backup-(.+)\.backup$/)
    return match ? match[1] : null
  }

  /**
   * Generate unique temporary filename
   */
  static generateTempFilename(prefix: string = 'temp'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${random}`
  }

  /**
   * Sanitize description for safe storage
   */
  static sanitizeDescription(description: string): string {
    return description
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .trim()
      .substring(0, 255) // Limit length
  }

  /**
   * Check if backup is recent (within specified hours)
   */
  static isRecentBackup(createdAt: Date, hoursThreshold: number = 24): boolean {
    const now = new Date()
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return diffHours <= hoursThreshold
  }

  /**
   * Parse backup creation date from ID
   */
  static parseCreationDateFromId(backupId: string): Date | null {
    try {
      // Extract timestamp part from backup ID
      const timestampPart = backupId.split('-').slice(0, 4).join('-')
      const isoString = timestampPart.replace(/-/g, ':').replace(/T(\d{2}):(\d{2}):(\d{2})/, 'T$1:$2:$3')
      return new Date(isoString)
    } catch {
      return null
    }
  }
}