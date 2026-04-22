"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface TimetableFiltersProps {
  onFilterChange: (filters: { programId?: number; semesterId?: number }) => void
}

export function TimetableFilters({ onFilterChange }: TimetableFiltersProps) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>()
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | undefined>()
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

  useEffect(() => {
    onFilterChange({
      programId: selectedProgramId,
      semesterId: selectedSemesterId
    })
  }, [selectedProgramId, selectedSemesterId, onFilterChange])

  const handleProgramChange = (value: string) => {
    const programId = value === 'all' ? undefined : parseInt(value)
    setSelectedProgramId(programId)
    setSelectedSemesterId(undefined) // Reset semester when program changes
  }

  const handleSemesterChange = (value: string) => {
    const semesterId = value === 'all' ? undefined : parseInt(value)
    setSelectedSemesterId(semesterId)
  }

  const clearFilters = () => {
    setSelectedProgramId(undefined)
    setSelectedSemesterId(undefined)
  }

  const getSemesterOrdinal = (number: number) => {
    if (number === 1) return '1st'
    if (number === 2) return '2nd'
    if (number === 3) return '3rd'
    return `${number}th`
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)
  const availableSemesters = selectedProgram?.semesters || []

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Program:</label>
        <Select
          value={selectedProgramId?.toString() || 'all'}
          onValueChange={handleProgramChange}
          disabled={loading}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={loading ? "Loading..." : "All Programs"} />
          </SelectTrigger>
          <SelectContent 
            className="z-[9999] max-h-[300px] overflow-y-auto"
            position="popper"
            side="bottom"
            align="start"
          >
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id.toString()}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <Select
          value={selectedSemesterId?.toString() || 'all'}
          onValueChange={handleSemesterChange}
          disabled={!selectedProgramId}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={selectedProgramId ? "All Semesters" : "Select Program First"} />
          </SelectTrigger>
          <SelectContent 
            className="z-[9999] max-h-[300px] overflow-y-auto"
            position="popper"
            side="bottom"
            align="start"
          >
            <SelectItem value="all">All Semesters</SelectItem>
            {availableSemesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id.toString()}>
                {getSemesterOrdinal(semester.number)} Semester
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedProgramId || selectedSemesterId) && (
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



      {selectedProgramId && (
        <div className="text-sm text-gray-600">
          Showing: {selectedProgram?.name}
          {selectedSemesterId && (
            <span> - {getSemesterOrdinal(availableSemesters.find(s => s.id === selectedSemesterId)?.number || 0)} Semester</span>
          )}
        </div>
      )}
    </div>
  )
}