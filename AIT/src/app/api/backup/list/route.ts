import { NextRequest, NextResponse } from 'next/server'
import { TimetableBackupService } from '@/lib/backup/backup-service'

// GET /api/backup/list - Get all backups
export async function GET(request: NextRequest) {
  try {
    const backupService = new TimetableBackupService()
    const backups = await backupService.listBackups()

    return NextResponse.json({
      success: true,
      data: backups,
      count: backups.length
    })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list backups' 
      },
      { status: 500 }
    )
  }
}