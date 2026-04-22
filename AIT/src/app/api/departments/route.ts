import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/departments - Get all departments with their programs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePrograms = searchParams.get('includePrograms') === 'true'
    const includeFaculty = searchParams.get('includeFaculty') === 'true'
    const includeStats = searchParams.get('includeStats') === 'true'

    const departments = await prisma.department.findMany({
      include: {
        programs: includePrograms ? {
          include: {
            semesters: {
              include: {
                courses: true
              }
            }
          }
        } : false,
        faculty: includeFaculty,
        _count: includeStats ? {
          select: {
            programs: true,
            faculty: true
          }
        } : false
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: departments
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      code, 
      description, 
      headOfDept, 
      email, 
      phone, 
      location 
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check if department with same name or code already exists
    const existingDept = await prisma.department.findFirst({
      where: {
        OR: [
          { name },
          ...(code ? [{ code }] : [])
        ]
      }
    })

    if (existingDept) {
      return NextResponse.json(
        { 
          success: false, 
          error: existingDept.name === name 
            ? 'Department with this name already exists'
            : 'Department with this code already exists'
        },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        headOfDept,
        email,
        phone,
        location
      },
      include: {
        _count: {
          select: {
            programs: true,
            faculty: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Department created successfully'
    })
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create department' },
      { status: 500 }
    )
  }
}

// PUT /api/departments - Update multiple departments (bulk operations)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { operations } = body

    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { success: false, error: 'Operations must be an array' },
        { status: 400 }
      )
    }

    const results = []

    for (const operation of operations) {
      const { id, action, data } = operation

      try {
        if (action === 'update') {
          const updated = await prisma.department.update({
            where: { id },
            data,
            include: {
              _count: {
                select: {
                  programs: true,
                  faculty: true
                }
              }
            }
          })
          results.push({ success: true, data: updated })
        } else if (action === 'delete') {
          await prisma.department.delete({
            where: { id }
          })
          results.push({ success: true, id })
        }
      } catch (error) {
        results.push({ 
          success: false, 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error in bulk operations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operations' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments - Delete all departments (with confirmation)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')

    if (confirm !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Confirmation required' },
        { status: 400 }
      )
    }

    const count = await prisma.department.count()
    await prisma.department.deleteMany()

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} departments`
    })
  } catch (error) {
    console.error('Error deleting departments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete departments' },
      { status: 500 }
    )
  }
}