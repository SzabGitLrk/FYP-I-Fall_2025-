import { NextRequest, NextResponse } from 'next/server'
import { TimetableRestoreService } from '@/lib/backup/restore-service'
import { RestoreOptions } from '@/lib/backup/types'

// POST /api/restore/[id] - Restore from backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params
    const body = await request.json()
    const { createPreRestoreBackup, skipValidation }: RestoreOptions = body

    const restoreService = new TimetableRestoreService()
    
    const result = await restoreService.restoreFromBackup(backupId, {
      createPreRestoreBackup,
      skipValidation
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Database restored successfully'
    })
  } catch (error) {
    console.error('Error restoring from backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restore from backup' 
      },
      { status: 500 }
    )
  }
}