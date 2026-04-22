import { NextRequest, NextResponse } from 'next/server'
import { TimetableBackupService } from '@/lib/backup/backup-service'

// GET /api/backup/[id] - Get backup details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params
    const backupService = new TimetableBackupService()
    
    const backupInfo = await backupService.getBackupInfo(backupId)

    return NextResponse.json({
      success: true,
      data: backupInfo
    })
  } catch (error) {
    console.error('Error getting backup info:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get backup info' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/backup/[id] - Delete backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params
    const backupService = new TimetableBackupService()
    
    await backupService.deleteBackup(backupId)

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete backup' 
      },
      { status: 500 }
    )
  }
}