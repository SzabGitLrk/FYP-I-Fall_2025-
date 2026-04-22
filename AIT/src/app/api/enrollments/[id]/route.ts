import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// DELETE /api/enrollments/[id] - Delete an enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const enrollmentId = parseInt(id)
    
    if (isNaN(enrollmentId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid enrollment ID'
        },
        { status: 400 }
      )
    }
    
    // Check if enrollment exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId }
    })
    
    if (!existingEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enrollment not found'
        },
        { status: 404 }
      )
    }
    
    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        id: enrollmentId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting enrollment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete enrollment'
      },
      { status: 500 }
    )
  }
}
