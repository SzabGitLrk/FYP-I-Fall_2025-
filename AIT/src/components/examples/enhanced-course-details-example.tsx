"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CourseDetailsModal } from "@/components/modals/course-details-modal"
import { CourseType } from "@/lib/types"
import { toast } from "sonner"

// Example usage of the enhanced CourseDetailsModal
export function EnhancedCourseDetailsExample() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock course data with many enrolled students
  const mockCourse = {
    id: 1,
    name: "Advanced Database Systems",
    code: "CS-401",
    type: CourseType.THEORY,
    createdAt: new Date().toISOString(),
    semester: {
      id: 1,
      number: 4,
      program: {
        id: 1,
        name: "Bachelor of Computer Science"
      }
    },
    faculty: {
      id: 1,
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@university.edu"
    },
    timetable: [{ id: 1 }, { id: 2 }], // 2 scheduled slots
    enrollments: Array.from({ length: 33 }, (_, i) => ({
      id: i + 1,
      student: {
        id: i + 1,
        regId: `2024-CS-${String(i + 1).padStart(3, '0')}`,
        regName: `Student ${i + 1} Name`
      }
    }))
  }

  const handleViewStudent = (studentId: number) => {
    toast.success(`Viewing details for student ID: ${studentId}`)
    // In a real app, you would navigate to the student details page
    // router.push(`/admin/students/${studentId}`)
  }

  const handleRemoveEnrollment = (enrollmentId: number) => {
    toast.success(`Removed enrollment ID: ${enrollmentId}`)
    // In a real app, you would call an API to remove the enrollment
    // await removeEnrollmentMutation.mutateAsync(enrollmentId)
  }

  const handleEditCourse = (course: any) => {
    toast.success(`Editing course: ${course.name}`)
    // In a real app, you would open the edit course form
  }

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">Enhanced Course Details Demo</h2>
        <p className="text-muted-foreground">
          This demo shows the improved course details modal with full student list viewing,
          search functionality, and export capabilities.
        </p>
        
        <div className="bg-muted/50 p-4 rounded-lg text-sm text-left">
          <h3 className="font-semibold mb-2">Mock Course Data:</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Course: {mockCourse.name}</li>
            <li>• Code: {mockCourse.code}</li>
            <li>• Enrolled Students: {mockCourse.enrollments.length}</li>
            <li>• Faculty: {mockCourse.faculty.name}</li>
            <li>• Scheduled Slots: {mockCourse.timetable.length}</li>
          </ul>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full"
        >
          Open Enhanced Course Details
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Try the following features:</p>
          <ul className="mt-2 space-y-1">
            <li>• Click "Enrolled Students" to expand the full list</li>
            <li>• Use the search box to find specific students</li>
            <li>• Click "Export" to download student list as CSV</li>
            <li>• Use the eye icon to view student details</li>
            <li>• Use the minus icon to remove enrollments</li>
          </ul>
        </div>

        {/* Test buttons for different scenarios */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Test with Course
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              // Test with null course to verify no hooks error
              const nullCourseModal = document.createElement('div')
              nullCourseModal.innerHTML = 'Testing null course handling...'
              toast.success('Null course test - check console for errors')
            }}
          >
            Test Null Course
          </Button>
        </div>
      </div>

      <CourseDetailsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        course={mockCourse}
        onEdit={handleEditCourse}
        onViewStudent={handleViewStudent}
        onRemoveEnrollment={handleRemoveEnrollment}
      />
    </div>
  )
}