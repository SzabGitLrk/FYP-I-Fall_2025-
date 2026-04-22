import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { RoomType } from '@prisma/client'

// Validation schema for creating a room
const createRoomSchema = z.object({
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

// GET /api/rooms - List all rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const whereClause = type ? { type: type as RoomType } : {}
    
    const rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        timetable: {
          include: {
            course: {
              include: {
                semester: {
                  include: {
                    program: true
                  }
                }
              }
            },
            timeslot: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: rooms
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rooms'
      },
      { status: 500 }
    )
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createRoomSchema.parse(body)
    
    // Check if room with same name already exists
    const existingRoom = await prisma.room.findFirst({
      where: {
        name: validatedData.name
      }
    })
    
    if (existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'A room with this name already exists'
        },
        { status: 409 }
      )
    }
    
    // Create the room
    const room = await prisma.room.create({
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
    
    return NextResponse.json(
      {
        success: true,
        data: room,
        message: 'Room created successfully'
      },
      { status: 201 }
    )
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
    
    console.error('Error creating room:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create room'
      },
      { status: 500 }
    )
  }
}