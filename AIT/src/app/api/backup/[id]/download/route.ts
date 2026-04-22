import { NextRequest, NextResponse } from 'next/server'
import { TimetableBackupService } from '@/lib/backup/backup-service'

// GET /api/backup/[id]/download - Download backup file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params
    const backupService = new TimetableBackupService()
    
    // Get backup info for filename
    const backupInfo = await backupService.getBackupInfo(backupId)
    
    // Get backup file buffer
    const buffer = await backupService.downloadBackup(backupId)
    
    // Create filename with timestamp
    const timestamp = backupInfo.createdAt.toISOString().split('T')[0]
    const filename = `timetable-backup-${timestamp}-${backupId.slice(-6)}.backup`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to download backup' 
      },
      { status: 500 }
    )
  }
}