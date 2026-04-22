"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  BookMarked,
  FlaskConical,
  User,
  Edit,
  X,
  Code,
  Layers,
} from "lucide-react"
import { CourseType } from "@/lib/types"
import { motion } from "framer-motion"

interface Course {
  id: number
  name: string
  code: string | null
  type: CourseType
  faculty?: {
    id: number
    name: string
    email: string
  }
}

interface SemesterCourseDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onEdit: (course: Course) => void
}

export function SemesterCourseDetailsModal({
  open,
  onOpenChange,
  course,
  onEdit,
}: SemesterCourseDetailsModalProps) {
  if (!course) return null

  const courseGradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-violet-500",
    "from-rose-500 to-pink-500",
  ]

  const gradient = courseGradients[course.id % courseGradients.length]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{course.name}</DialogTitle>
              <DialogDescription>
                View and manage course details
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Course Header Card */}
          <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 opacity-10" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {course.type === CourseType.LAB ? (
                      <FlaskConical className="h-8 w-8 text-white" />
                    ) : (
                      <BookMarked className="h-8 w-8 text-white" />
                    )}
                    <div>
                      <Badge className="bg-white/20 text-white border-white/30 mb-2">
                        {course.type}
                      </Badge>
                      {course.code && (
                        <p className="text-white/90 text-sm font-medium">{course.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Name */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course Name
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{course.name}</p>
              </CardContent>
            </Card>

            {/* Course Code */}
            {course.code && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Course Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{course.code}</p>
                </CardContent>
              </Card>
            )}

            {/* Course Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {course.type === CourseType.LAB ? (
                    <FlaskConical className="h-4 w-4" />
                  ) : (
                    <BookMarked className="h-4 w-4" />
                  )}
                  Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={course.type === CourseType.LAB ? "secondary" : "default"}>
                  {course.type}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Faculty Information */}
          {course.faculty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Faculty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{course.faculty.name}</p>
                  <p className="text-sm text-muted-foreground">{course.faculty.email}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              onEdit(course)
              onOpenChange(false)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
