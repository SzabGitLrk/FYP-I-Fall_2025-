import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/departments/[id] - Get a specific department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const { searchParams } = new URL(request.url)
    const includePrograms = searchParams.get('includePrograms') === 'true'
    const includeFaculty = searchParams.get('includeFaculty') === 'true'

    console.log('[GET Department] ID:', id, 'includePrograms:', includePrograms, 'includeFaculty:', includeFaculty)

    if (isNaN(id)) {
      console.error('[GET Department] Invalid ID:', idParam)
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      )
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        programs: includePrograms ? {
          include: {
            semesters: {
              include: {
                courses: {
                  include: {
                    faculty: true
                  }
                }
              }
            }
          }
        } : false,
        faculty: includeFaculty,
        _count: {
          select: {
            programs: true,
            faculty: true
          }
        }
      }
    })

    if (!department) {
      console.error('[GET Department] Department not found with ID:', id)
      return NextResponse.json(
        { success: false, error: `Department with ID ${id} not found` },
        { status: 404 }
      )
    }

    console.log('[GET Department] Success:', department.name)
    return NextResponse.json({
      success: true,
      data: department
    })
  } catch (error) {
    console.error('[GET Department] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department' },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[id] - Update a specific department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      )
    }

    const { 
      name, 
      code, 
      description, 
      headOfDept, 
      email, 
      phone, 
      location 
    } = body

    // Check if department exists
    const existingDept = await prisma.department.findUnique({
      where: { id }
    })

    if (!existingDept) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check for name/code conflicts with other departments
    if (name || code) {
      const conflictDept = await prisma.department.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(name ? [{ name }] : []),
                ...(code ? [{ code }] : [])
              ]
            }
          ]
        }
      })

      if (conflictDept) {
        return NextResponse.json(
          { 
            success: false, 
            error: conflictDept.name === name 
              ? 'Department with this name already exists'
              : 'Department with this code already exists'
          },
          { status: 400 }
        )
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(headOfDept !== undefined && { headOfDept }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location })
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
      data: updatedDepartment,
      message: 'Department updated successfully'
    })
  } catch (error) {
    console.error('Error updating department:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete a specific department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      )
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            programs: true,
            faculty: true
          }
        }
      }
    })

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if department has programs or faculty
    if (department._count.programs > 0 || department._count.faculty > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete department. It has ${department._count.programs} programs and ${department._count.faculty} faculty members.`
        },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}