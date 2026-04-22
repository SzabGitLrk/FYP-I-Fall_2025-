import { NextRequest, NextResponse } from 'next/server'
import { TimetableRestoreService } from '@/lib/backup/restore-service'

// POST /api/restore/[id]/validate - Validate backup for restore
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params
    const restoreService = new TimetableRestoreService()
    
    const result = await restoreService.validateBackup(backupId)

    return NextResponse.json({
      success: true,
      data: result,
      message: result.isValid ? 'Backup is valid for restore' : 'Backup validation failed'
    })
  } catch (error) {
    console.error('Error validating backup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate backup' 
      },
      { status: 500 }
    )
  }
}