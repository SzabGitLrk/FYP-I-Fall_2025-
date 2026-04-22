"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface EnrolledCourse {
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
}

interface EnrolledCoursesListProps {
  enrollments: EnrolledCourse[]
  onRemove: (enrollmentId: number) => void
  isRemoving?: boolean
}

export function EnrolledCoursesList({ 
  enrollments, 
  onRemove,
  isRemoving = false 
}: EnrolledCoursesListProps) {
  // Handle empty state
  if (enrollments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No courses enrolled yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {enrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          className="flex items-start justify-between gap-4 p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 space-y-1">
            {/* Course code and name */}
            <div className="font-medium text-sm">
              {enrollment.course.code} - {enrollment.course.name}
            </div>
            
            {/* Course type and semester */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{enrollment.course.type}</span>
              <span>•</span>
              <span>Semester {enrollment.course.semester.number}</span>
              <span>•</span>
              <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            
            {/* Status badge */}
            <div>
              <Badge 
                variant={enrollment.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {enrollment.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          
          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(enrollment.id)}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Remove enrollment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
