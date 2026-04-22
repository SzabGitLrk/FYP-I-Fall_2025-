import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { BackupStorageManager } from '@/lib/backup/storage'
import { BackupArchiveManager } from '@/lib/backup/archive-manager'
import { BackupUtils } from '@/lib/backup/utils'

// POST /api/backup/upload - Upload a backup file
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Receiving backup file upload...')

    // Get the uploaded file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.backup')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Must be a .backup file' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`📦 Uploaded file: ${file.name}, Size: ${BackupUtils.formatFileSize(buffer.length)}`)

    // Validate the backup file structure
    const archiveManager = new BackupArchiveManager()
    let backupData
    
    try {
      // Try to extract and validate the backup
      const tempPath = `/tmp/upload-${Date.now()}.backup`
      await writeFile(tempPath, buffer)
      backupData = await archiveManager.extractArchive(tempPath)
      
      // Validate structure
      if (!backupData.version || !backupData.metadata || !backupData.database) {
        return NextResponse.json(
          { success: false, error: 'Invalid backup file structure' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('❌ Invalid backup file:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or corrupted backup file. Cannot extract data.' 
        },
        { status: 400 }
      )
    }

    // Generate new backup ID for the uploaded file
    const storageManager = new BackupStorageManager()
    const backupId = storageManager.generateBackupId()
    
    // Save the uploaded file to backups directory
    const backupPath = storageManager.getBackupFilePath(backupId)
    await writeFile(backupPath, buffer)

    // Update metadata with new ID and upload info
    const metadata = {
      ...backupData.metadata,
      id: backupId,
      uploadedAt: new Date().toISOString(),
      originalFileName: file.name,
      uploadedBy: 'user', // Could be enhanced with actual user info
      isUploaded: true
    }

    // Save metadata
    await storageManager.writeMetadata(backupId, metadata)

    console.log(`✅ Backup uploaded successfully: ${backupId}`)

    return NextResponse.json({
      success: true,
      data: {
        backupId,
        originalFileName: file.name,
        size: buffer.length,
        uploadedAt: metadata.uploadedAt,
        metadata: {
          totalTables: backupData.metadata.totalTables,
          totalRecords: backupData.metadata.totalRecords,
          createdAt: backupData.metadata.createdAt,
          description: backupData.metadata.description
        }
      },
      message: 'Backup uploaded successfully. You can now restore from this backup.'
    })

  } catch (error) {
    console.error('❌ Error uploading backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload backup' 
      },
      { status: 500 }
    )
  }
}

// Configure for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}
