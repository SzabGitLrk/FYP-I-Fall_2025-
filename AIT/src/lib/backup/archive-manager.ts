// Archive management for backup compression and extraction

import { promises as fs } from 'fs'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { ArchiveManager } from './interfaces'
import { BackupData } from './types'
import { BackupUtils } from './utils'

export class BackupArchiveManager implements ArchiveManager {
  
  async createArchive(data: BackupData): Promise<string> {
    try {
      console.log('🗜️ Creating backup archive...')
      
      // Convert data to JSON string
      const jsonData = JSON.stringify(data, null, 2)
      
      // Compress the data
      const compressedData = await this.compressData(jsonData, 6)
      
      // Generate temporary file path
      const tempFilePath = `/tmp/backup-${Date.now()}.backup`
      
      // Write compressed data to file
      await fs.writeFile(tempFilePath, compressedData)
      
      console.log(`✅ Archive created: ${BackupUtils.formatFileSize(compressedData.length)}`)
      
      return tempFilePath
    } catch (error) {
      console.error('❌ Archive creation failed:', error)
      throw new Error(`Archive creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async extractArchive(filePath: string): Promise<BackupData> {
    try {
      console.log('📦 Extracting backup archive...')
      
      // Read compressed file
      const compressedData = await fs.readFile(filePath)
      
      // Decompress the data
      const decompressedData = await this.decompressData(compressedData)
      
      // Parse JSON data
      const data: BackupData = JSON.parse(decompressedData.toString())
      
      console.log('✅ Archive extracted successfully')
      
      return data
    } catch (error) {
      console.error('❌ Archive extraction failed:', error)
      throw new Error(`Archive extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async validateArchive(filePath: string): Promise<boolean> {
    try {
      console.log('🔍 Validating backup archive...')
      
      // Check if file exists
      await fs.access(filePath)
      
      // Try to extract and validate structure
      const data = await this.extractArchive(filePath)
      
      // Validate required properties
      const isValid = !!(
        data.version &&
        data.metadata &&
        data.database &&
        data.database.schema &&
        data.database.tables &&
        data.database.metadata
      )
      
      console.log(`✅ Archive validation: ${isValid ? 'PASSED' : 'FAILED'}`)
      
      return isValid
    } catch (error) {
      console.error('❌ Archive validation failed:', error)
      return false
    }
  }

  async compressData(data: unknown, level: number = 6): Promise<Buffer> {
    try {
      const input = typeof data === 'string' ? data : JSON.stringify(data)
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const gzip = createGzip({ level })
        
        gzip.on('data', (chunk) => chunks.push(chunk))
        gzip.on('end', () => resolve(Buffer.concat(chunks)))
        gzip.on('error', reject)
        
        gzip.write(input)
        gzip.end()
      })
    } catch (error) {
      throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async decompressData(compressedData: Buffer): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const gunzip = createGunzip()
        
        gunzip.on('data', (chunk) => chunks.push(chunk))
        gunzip.on('end', () => resolve(Buffer.concat(chunks)))
        gunzip.on('error', reject)
        
        gunzip.write(compressedData)
        gunzip.end()
      })
    } catch (error) {
      throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}