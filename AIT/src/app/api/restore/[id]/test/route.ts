import { NextRequest, NextResponse } from 'next/server'
import { TimetableRestoreService } from '@/lib/backup/restore-service'

// POST /api/restore/[id]/test - Test restore operation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params
    const restoreService = new TimetableRestoreService()
    
    const result = await restoreService.testRestore(backupId)

    return NextResponse.json({
      success: true,
      data: result,
      message: result.success ? 'Test restore completed successfully' : 'Test restore failed'
    })
  } catch (error) {
    console.error('Error testing restore:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test restore' 
      },
      { status: 500 }
    )
  }
}