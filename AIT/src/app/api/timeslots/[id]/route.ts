import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating a time slot
const updateTimeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM format'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM format')
}).refine((data) => {
  const startTime = new Date(`1970-01-01T${data.start}:00`)
  const endTime = new Date(`1970-01-01T${data.end}:00`)
  return endTime > startTime
}, {
  message: "End time must be after start time",
  path: ["end"]
})

// GET /api/timeslots/[id] - Get a specific time slot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const timeSlotId = parseInt(id)
    
    if (isNaN(timeSlotId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid time slot ID'
        },
        { status: 400 }
      )
    }
    
    const timeSlot = await prisma.timeSlot.findUnique({
      where: {
        id: timeSlotId
      },
      include: {
        timetable: {
          include: {
            course: {
              include: {
                semester: {
                  include: {
                    program: true
                  }
                },
                faculty: true
              }
            },
            room: true
          },
          orderBy: [
            { day: 'asc' },
            { course: { name: 'asc' } }
          ]
        }
      }
    })
    
    if (!timeSlot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time slot not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: timeSlot
    })
  } catch (error) {
    console.error('Error fetching time slot:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch time slot'
      },
      { status: 500 }
    )
  }
}

// PUT /api/timeslots/[id] - Update a specific time slot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const timeSlotId = parseInt(id)
    
    if (isNaN(timeSlotId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid time slot ID'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateTimeSlotSchema.parse(body)
    
    // Check if time slot exists
    const existingTimeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId }
    })
    
    if (!existingTimeSlot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time slot not found'
        },
        { status: 404 }
      )
    }
    
    // Check if another time slot with same start and end time exists
    const duplicateTimeSlot = await prisma.timeSlot.findFirst({
      where: {
        start: validatedData.start,
        end: validatedData.end,
        id: { not: timeSlotId }
      }
    })
    
    if (duplicateTimeSlot) {
      return NextResponse.json(
        {
          success: false,
          error: 'A time slot with this start and end time already exists'
        },
        { status: 409 }
      )
    }
    
    // Check for overlapping time slots (excluding current one)
    const overlappingSlots = await prisma.timeSlot.findMany({
      where: {
        id: { not: timeSlotId },
        OR: [
          // New slot starts during existing slot
          {
            AND: [
              { start: { lte: validatedData.start } },
              { end: { gt: validatedData.start } }
            ]
          },
          // New slot ends during existing slot
          {
            AND: [
              { start: { lt: validatedData.end } },
              { end: { gte: validatedData.end } }
            ]
          },
          // New slot completely contains existing slot
          {
            AND: [
              { start: { gte: validatedData.start } },
              { end: { lte: validatedData.end } }
            ]
          }
        ]
      }
    })
    
    if (overlappingSlots.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'This time slot overlaps with existing time slots'
        },
        { status: 409 }
      )
    }
    
    // Update the time slot
    const updatedTimeSlot = await prisma.timeSlot.update({
      where: {
        id: timeSlotId
      },
      data: {
        start: validatedData.start,
        end: validatedData.end
      },
      include: {
        timetable: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedTimeSlot,
      message: 'Time slot updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    console.error('Error updating time slot:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update time slot'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/timeslots/[id] - Delete a specific time slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const timeSlotId = parseInt(id)
    
    if (isNaN(timeSlotId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid time slot ID'
        },
        { status: 400 }
      )
    }
    
    // Check if time slot exists
    const existingTimeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        timetable: true
      }
    })
    
    if (!existingTimeSlot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time slot not found'
        },
        { status: 404 }
      )
    }
    
    // Check if time slot is being used in timetable
    if (existingTimeSlot.timetable.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete time slot that is being used in the timetable. Please remove the time slot from the timetable first.'
        },
        { status: 409 }
      )
    }
    
    // Delete the time slot
    await prisma.timeSlot.delete({
      where: {
        id: timeSlotId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Time slot deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting time slot:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete time slot'
      },
      { status: 500 }
    )
  }
}