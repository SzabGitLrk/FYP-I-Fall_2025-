import { NextRequest, NextResponse } from 'next/server'
import { TimetableBackupService } from '@/lib/backup/backup-service'
import { BackupOptions } from '@/lib/backup/types'

// POST /api/backup/create - Create new backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, includeMetrics, compressionLevel }: BackupOptions = body

    const backupService = new TimetableBackupService()
    
    const result = await backupService.createBackup({
      description,
      includeMetrics,
      compressionLevel
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Backup created successfully'
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create backup' 
      },
      { status: 500 }
    )
  }
}