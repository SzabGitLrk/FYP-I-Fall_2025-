import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface StudentRow {
  regId?: string
  regName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  programCode?: string
  semesterNumber?: string | number
  isActive?: string | boolean
}

interface ImportError {
  row: number
  error: string
  data: any
}

// Simple CSV parser function
function parseCSV(content: string): StudentRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map(h => h.trim())

  // Parse data rows
  const rows: StudentRow[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue // Skip empty lines

    const values = parseCSVLine(lines[i])
    const row: StudentRow = {}

    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        row[header as keyof StudentRow] = values[index].trim()
      }
    })

    if (Object.keys(row).length > 0) {
      rows.push(row)
    }
  }

  return rows
}

// Helper function to parse CSV line respecting quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  return result
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided'
        },
        { status: 400 }
      )
    }

    // Read file as text
    const fileContent = await file.text()

    // Parse CSV manually
    const rows = parseCSV(fileContent)
    
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'CSV file is empty'
        },
        { status: 400 }
      )
    }

    const errors: ImportError[] = []
    let successCount = 0

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because of header row and 0-indexing

      try {
        // Validate required fields
        if (!row.regId || !row.regId.trim()) {
          errors.push({
            row: rowNumber,
            error: 'regId (Registration ID) is required',
            data: row
          })
          continue
        }

        if (!row.regName || !row.regName.trim()) {
          errors.push({
            row: rowNumber,
            error: 'regName (Student Name) is required',
            data: row
          })
          continue
        }

        const regId = row.regId.trim()
        const regName = row.regName.trim()

        // Check if student already exists
        const existingStudent = await prisma.student.findUnique({
          where: { regId }
        })

        if (existingStudent) {
          errors.push({
            row: rowNumber,
            error: `A student with regId "${regId}" already exists`,
            data: row
          })
          continue
        }

        // Check email uniqueness (if provided)
        const email = row.email ? row.email.trim() : null
        if (email) {
          const existingEmail = await prisma.student.findUnique({
            where: { email }
          })

          if (existingEmail) {
            errors.push({
              row: rowNumber,
              error: `A student with email "${email}" already exists`,
              data: row
            })
            continue
          }
        }

        // Prepare student data
        const studentData: any = {
          regId,
          regName,
          isActive: row.isActive === 'true' || row.isActive === true || row.isActive === '1',
        }

        // Optional fields
        if (email) {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
            errors.push({
              row: rowNumber,
              error: `Invalid email format: "${email}"`,
              data: row
            })
            continue
          }
          studentData.email = email
        }

        if (row.phone) {
          studentData.phone = row.phone.trim()
        }

        if (row.address) {
          studentData.address = row.address.trim()
        }

        // Handle date of birth
        if (row.dateOfBirth) {
          try {
            const dateOfBirth = new Date(row.dateOfBirth)
            if (isNaN(dateOfBirth.getTime())) {
              throw new Error('Invalid date')
            }
            studentData.dateOfBirth = dateOfBirth
          } catch {
            errors.push({
              row: rowNumber,
              error: `Invalid dateOfBirth format: "${row.dateOfBirth}". Use YYYY-MM-DD`,
              data: row
            })
            continue
          }
        }

        // Handle program
        if (row.programCode) {
          const programCode = row.programCode.trim()
          const program = await prisma.program.findFirst({
            where: {
              code: {
                equals: programCode,
                mode: 'insensitive'
              }
            }
          })

          if (!program) {
            errors.push({
              row: rowNumber,
              error: `Program with code "${programCode}" not found`,
              data: row
            })
            continue
          }

          studentData.programId = program.id
        }

        // Handle semester
        if (row.semesterNumber) {
          const semesterNum = parseInt(String(row.semesterNumber), 10)
          if (isNaN(semesterNum) || semesterNum < 1) {
            errors.push({
              row: rowNumber,
              error: `Invalid semesterNumber: "${row.semesterNumber}". Must be a positive integer`,
              data: row
            })
            continue
          }

          const semester = await prisma.semester.findFirst({
            where: {
              number: semesterNum
            }
          })

          if (!semester) {
            errors.push({
              row: rowNumber,
              error: `Semester with number ${semesterNum} not found`,
              data: row
            })
            continue
          }

          studentData.semesterId = semester.id
        }

        // Create student
        await prisma.student.create({
          data: studentData,
          include: {
            program: {
              include: {
                department: true
              }
            },
            semester: true,
            enrollments: {
              include: {
                course: true
              }
            }
          }
        })

        successCount++
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          data: row
        })
      }
    }

    return NextResponse.json({
      success: errors.length === 0 || successCount > 0,
      message: errors.length === 0 ? 'All students imported successfully' : `Imported ${successCount} students with ${errors.length} errors`,
      data: {
        total: rows.length,
        successful: successCount,
        failed: errors.length,
        errors
      }
    })
  } catch (error) {
    console.error('Bulk import error:', error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import students'
      },
      { status: 500 }
    )
  }
}
