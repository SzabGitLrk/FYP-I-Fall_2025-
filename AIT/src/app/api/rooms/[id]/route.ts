import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { RoomType } from '@prisma/client'

// Validation schema for updating a room
const updateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Room name too long'),
  type: z.nativeEnum(RoomType, { message: 'Room type must be CLASSROOM or LAB' }),
  minCapacity: z.number().int().min(1, 'Minimum capacity must be at least 1').optional(),
  maxCapacity: z.number().int().min(1, 'Maximum capacity must be at least 1').optional()
}).refine((data) => {
  if (data.minCapacity && data.maxCapacity) {
    return data.minCapacity <= data.maxCapacity
  }
  return true
}, {
  message: 'Minimum capacity cannot be greater than maximum capacity',
  path: ['maxCapacity']
})

// GET /api/rooms/[id] - Get a specific room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const roomId = parseInt(id)
    
    if (isNaN(roomId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid room ID'
        },
        { status: 400 }
      )
    }
    
    const room = await prisma.room.findUnique({
      where: {
        id: roomId
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
            timeslot: true
          },
          orderBy: [
            { day: 'asc' },
            { timeslot: { start: 'asc' } }
          ]
        }
      }
    })
    
    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: room
    })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch room'
      },
      { status: 500 }
    )
  }
}

// PUT /api/rooms/[id] - Update a specific room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const roomId = parseInt(id)
    
    if (isNaN(roomId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid room ID'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateRoomSchema.parse(body)
    
    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    })
    
    if (!existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found'
        },
        { status: 404 }
      )
    }
    
    // Check if another room with same name exists
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        name: validatedData.name,
        id: { not: roomId }
      }
    })
    
    if (duplicateRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'A room with this name already exists'
        },
        { status: 409 }
      )
    }
    
    // Check if room type is being changed and if it has conflicting timetable entries
    if (existingRoom.type !== validatedData.type) {
      const timetableEntries = await prisma.timetable.findMany({
        where: { roomId },
        include: {
          course: true
        }
      })
      
      // Check for type conflicts
      const hasConflicts = timetableEntries.some(entry => {
        if (validatedData.type === RoomType.LAB && entry.course.type === 'THEORY') {
          return true
        }
        if (validatedData.type === RoomType.CLASSROOM && entry.course.type === 'LAB') {
          return true
        }
        return false
      })
      
      if (hasConflicts) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot change room type due to existing timetable entries with incompatible course types'
          },
          { status: 409 }
        )
      }
    }
    
    // Update the room
    const updatedRoom = await prisma.room.update({
      where: {
        id: roomId
      },
      data: {
        name: validatedData.name,
        type: validatedData.type,
        minCapacity: validatedData.minCapacity,
        maxCapacity: validatedData.maxCapacity
      },
      include: {
        timetable: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedRoom,
      message: 'Room updated successfully'
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
    
    console.error('Error updating room:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update room'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/rooms/[id] - Delete a specific room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const roomId = parseInt(id)
    
    if (isNaN(roomId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid room ID'
        },
        { status: 400 }
      )
    }
    
    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        timetable: true
      }
    })
    
    if (!existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found'
        },
        { status: 404 }
      )
    }
    
    // Check if room is being used in timetable
    if (existingRoom.timetable.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete room that is being used in the timetable. Please remove the room from the timetable first.'
        },
        { status: 409 }
      )
    }
    
    // Delete the room
    await prisma.room.delete({
      where: {
        id: roomId
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete room'
      },
      { status: 500 }
    )
  }
}