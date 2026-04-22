"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Program {
  id: number
  name: string
  semesters: Array<{
    id: number
    number: number
  }>
}

interface SimpleFiltersProps {
  onFilterChange: (filters: { programId?: number; semesterId?: number }) => void
  currentFilters: { programId?: number; semesterId?: number }
}

export function SimpleFilters({ onFilterChange, currentFilters }: SimpleFiltersProps) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (result.success) {
        setPrograms(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const programId = value === 'all' ? undefined : parseInt(value)
    onFilterChange({
      programId,
      semesterId: undefined // Reset semester when program changes
    })
  }

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const semesterId = value === 'all' ? undefined : parseInt(value)
    onFilterChange({
      programId: currentFilters.programId,
      semesterId
    })
  }

  const clearFilters = () => {
    onFilterChange({
      programId: undefined,
      semesterId: undefined
    })
  }

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const selectedProgram = programs.find(p => p.id === currentFilters.programId)
  const availableSemesters = selectedProgram?.semesters || []

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Program:</label>
        <select
          value={currentFilters.programId?.toString() || 'all'}
          onChange={handleProgramChange}
          disabled={loading}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Programs</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id.toString()}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <select
          value={currentFilters.semesterId?.toString() || 'all'}
          onChange={handleSemesterChange}
          disabled={!currentFilters.programId}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="all">All Semesters</option>
          {availableSemesters.map((semester) => (
            <option key={semester.id} value={semester.id.toString()}>
              {getSemesterOrdinal(semester.number)} Semester
            </option>
          ))}
        </select>
      </div>

      {(currentFilters.programId || currentFilters.semesterId) && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear Filters
        </Button>
      )}

      {currentFilters.programId && (
        <div className="text-sm text-gray-600">
          Showing: {selectedProgram?.name}
          {currentFilters.semesterId && (
            <span> - {getSemesterOrdinal(availableSemesters.find(s => s.id === currentFilters.semesterId)?.number || 0)} Semester</span>
          )}
        </div>
      )}
    </div>
  )
}