"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { EnrolledCoursesList } from "./enrolled-courses-list"

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

interface StudentEnrollmentRowProps {
  student: StudentWithEnrollments
  isExpanded: boolean
  onToggleExpand: () => void
  onEnrollClick: () => void
  onRemoveEnrollment: (enrollmentId: number) => void
}

export function StudentEnrollmentRow({
  student,
  isExpanded,
  onToggleExpand,
  onEnrollClick,
  onRemoveEnrollment,
}: StudentEnrollmentRowProps) {
  const enrollmentCount = student.enrollments.length

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Main row - clickable to expand/collapse */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggleExpand}
      >
        {/* Expand/collapse icon */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Student Reg ID */}
        <div className="w-32 shrink-0">
          <span className="font-medium text-sm">{student.regId}</span>
        </div>

        {/* Student Name */}
        <div className="w-48 shrink-0">
          <span className="text-sm">{student.regName}</span>
        </div>

        {/* Program */}
        <div className="w-48 shrink-0">
          <span className="text-sm text-muted-foreground">
            {student.program.code} - {student.program.name}
          </span>
        </div>

        {/* Department */}
        <div className="w-32 shrink-0">
          <span className="text-sm text-muted-foreground">
            {student.program.department.code}
          </span>
        </div>

        {/* Course count */}
        <div className="w-24 shrink-0">
          <span className="text-sm text-muted-foreground">
            {enrollmentCount} {enrollmentCount === 1 ? "course" : "courses"}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t bg-muted/30 p-4">
          <div className="space-y-4">
            {/* Enrolled courses heading */}
            <div className="font-semibold text-sm">
              Enrolled Courses ({enrollmentCount})
            </div>

            {/* Enrolled courses list */}
            <EnrolledCoursesList
              enrollments={student.enrollments}
              onRemove={onRemoveEnrollment}
            />

            {/* Enroll in more courses button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEnrollClick()
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Enroll in More Courses
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
