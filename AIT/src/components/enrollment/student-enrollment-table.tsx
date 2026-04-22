"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Download, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StudentEnrollmentRow } from "./student-enrollment-row"
import { useMemo, useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface StudentWithEnrollments {
  id: number
  regId: string
  regName: string
  email: string
  program: {
    id: number
    name: string
    code: string
    department: {
      id: number
      name: string
      code: string
    }
  }
  enrollments: Array<{
    id: number
    courseId: number
    course: {
      id: number
      name: string
      code: string
      type: string
      semester: {
        id: number
        number: number
      }
    }
    enrolledAt: string
    isActive: boolean
  }>
}

type SortField = 'regId' | 'regName' | 'program' | 'department' | 'enrollmentCount'
type SortDirection = 'asc' | 'desc'

interface StudentEnrollmentTableProps {
  students: StudentWithEnrollments[]
  expandedStudentIds: Set<number>
  onToggleExpand: (studentId: number) => void
  onEnrollClick: (studentId: number) => void
  onRemoveEnrollment: (enrollmentId: number) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  isLoading?: boolean
}

export function StudentEnrollmentTable({
  students,
  expandedStudentIds,
  onToggleExpand,
  onEnrollClick,
  onRemoveEnrollment,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: StudentEnrollmentTableProps) {
  // Local state for immediate input display (before debounce)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [sortField, setSortField] = useState<SortField>('regId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Debounce the search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchQuery, onSearchChange])

  // Sync local state when external searchQuery changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearchQuery("")
    onSearchChange("")
  }

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  // Export to CSV
  const handleExport = () => {
    const csvData = filteredAndSortedStudents.map(student => ({
      'Reg ID': student.regId,
      'Name': student.regName,
      'Email': student.email,
      'Program': student.program.name,
      'Department': student.program.department.name,
      'Total Enrollments': student.enrollments.length,
      'Active Enrollments': student.enrollments.filter(e => e.isActive).length,
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enrollments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let result = students

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (student) =>
          student.regId.toLowerCase().includes(query) ||
          student.regName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.program.name.toLowerCase().includes(query) ||
          student.program.department.name.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((student) => {
        const hasActiveEnrollments = student.enrollments.some(e => e.isActive)
        return filterStatus === 'active' ? hasActiveEnrollments : !hasActiveEnrollments
      })
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case 'regId':
          compareValue = a.regId.localeCompare(b.regId)
          break
        case 'regName':
          compareValue = a.regName.localeCompare(b.regName)
          break
        case 'program':
          compareValue = a.program.name.localeCompare(b.program.name)
          break
        case 'department':
          compareValue = a.program.department.name.localeCompare(b.program.department.name)
          break
        case 'enrollmentCount':
          compareValue = a.enrollments.length - b.enrollments.length
          break
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

    return result
  }, [students, searchQuery, sortField, sortDirection, filterStatus])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Search skeleton */}
        <Skeleton className="h-10 w-full max-w-sm" />
        
        {/* Table skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Reg ID, Name, Email, Program..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="default"
          onClick={handleExport}
          disabled={filteredAndSortedStudents.length === 0}
          className="shrink-0"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Results count */}
      {searchQuery.trim() || filterStatus !== 'all' ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {filteredAndSortedStudents.length} of {students.length} students</span>
          {(searchQuery.trim() || filterStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleClearSearch()
                setFilterStatus('all')
              }}
              className="h-6 px-2 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : null}

      {/* Table header */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 border-b">
          <div className="flex items-center gap-4 p-4 text-sm font-medium text-muted-foreground">
            <div className="w-5 shrink-0"></div> {/* Space for chevron */}
            
            <button
              onClick={() => handleSort('regId')}
              className="w-32 shrink-0 flex items-center hover:text-foreground transition-colors cursor-pointer"
            >
              Reg ID
              {getSortIcon('regId')}
            </button>
            
            <button
              onClick={() => handleSort('regName')}
              className="w-48 shrink-0 flex items-center hover:text-foreground transition-colors cursor-pointer"
            >
              Name
              {getSortIcon('regName')}
            </button>
            
            <button
              onClick={() => handleSort('program')}
              className="w-48 shrink-0 flex items-center hover:text-foreground transition-colors cursor-pointer"
            >
              Program
              {getSortIcon('program')}
            </button>
            
            <button
              onClick={() => handleSort('department')}
              className="w-32 shrink-0 flex items-center hover:text-foreground transition-colors cursor-pointer"
            >
              Department
              {getSortIcon('department')}
            </button>
            
            <button
              onClick={() => handleSort('enrollmentCount')}
              className="w-24 shrink-0 flex items-center hover:text-foreground transition-colors cursor-pointer"
            >
              Courses
              {getSortIcon('enrollmentCount')}
            </button>
          </div>
        </div>

        {/* Table body */}
        <div className="divide-y">
          {filteredAndSortedStudents.length === 0 ? (
            // Empty state
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery.trim() || filterStatus !== 'all'
                  ? "No students found matching your filters."
                  : "No students enrolled yet."}
              </p>
            </div>
          ) : (
            // Student rows
            filteredAndSortedStudents.map((student) => (
              <StudentEnrollmentRow
                key={student.id}
                student={student}
                isExpanded={expandedStudentIds.has(student.id)}
                onToggleExpand={() => onToggleExpand(student.id)}
                onEnrollClick={() => onEnrollClick(student.id)}
                onRemoveEnrollment={onRemoveEnrollment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
