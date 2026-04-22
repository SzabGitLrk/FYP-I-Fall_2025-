import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating a time slot
const createTimeSlotSchema = z.object({
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

// GET /api/timeslots - List all time slots
export async function GET() {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
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
            room: true
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: timeSlots
    })
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch time slots'
      },
      { status: 500 }
    )
  }
}

// POST /api/timeslots - Create a new time slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createTimeSlotSchema.parse(body)
    
    // Check if time slot with same start and end time already exists
    const existingTimeSlot = await prisma.timeSlot.findFirst({
      where: {
        start: validatedData.start,
        end: validatedData.end
      }
    })
    
    if (existingTimeSlot) {
      return NextResponse.json(
        {
          success: false,
          error: 'A time slot with this start and end time already exists'
        },
        { status: 409 }
      )
    }
    
    // Check for overlapping time slots
    const overlappingSlots = await prisma.timeSlot.findMany({
      where: {
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
    
    // Create the time slot
    const timeSlot = await prisma.timeSlot.create({
      data: {
        start: validatedData.start,
        end: validatedData.end
      },
      include: {
        timetable: true
      }
    })
    
    return NextResponse.json(
      {
        success: true,
        data: timeSlot,
        message: 'Time slot created successfully'
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
    
    console.error('Error creating time slot:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create time slot'
      },
      { status: 500 }
    )
  }
}