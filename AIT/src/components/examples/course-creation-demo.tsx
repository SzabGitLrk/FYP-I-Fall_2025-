"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnhancedCourseForm } from "@/components/forms/enhanced-course-form"
import { BulkCourseForm } from "@/components/forms/bulk-course-form"
import { QuickCourseForm } from "@/components/forms/quick-course-form"
import { 
  Zap, 
  Sparkles, 
  Upload, 
  BookOpen,
  FlaskConical,
  Users,
  FileText,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

export function CourseCreationDemo() {
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)

  const handleSuccess = () => {
    toast.success("Course creation demo completed!")
  }

  const features = [
    {
      title: "Quick Create",
      description: "Rapid course creation with essential information only",
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      color: "from-yellow-500 to-orange-500",
      features: [
        "Streamlined single-form interface",
        "Auto-generated course code suggestions", 
        "Smart defaults based on semester",
        "One-click creation process"
      ],
      action: () => setShowQuickForm(true)
    },
    {
      title: "Enhanced Form",
      description: "Full-featured course creation with advanced options",
      icon: <Sparkles className="h-6 w-6 text-purple-500" />,
      color: "from-purple-500 to-pink-500",
      features: [
        "Tabbed interface with templates",
        "Extended fields and validation",
        "Visual semester selection",
        "Course duplication support"
      ],
      action: () => setShowEnhancedForm(true)
    },
    {
      title: "Bulk Creation",
      description: "Create multiple courses simultaneously",
      icon: <Upload className="h-6 w-6 text-blue-500" />,
      color: "from-blue-500 to-cyan-500",
      features: [
        "Individual course entry",
        "CSV import functionality",
        "Batch processing with error handling",
        "Progress tracking and status"
      ],
      action: () => setShowBulkForm(true)
    }
  ]

  const templates = [
    {
      name: "Programming Course",
      type: "Theory",
      icon: <BookOpen className="h-5 w-5" />,
      color: "bg-blue-500"
    },
    {
      name: "Laboratory Course", 
      type: "Lab",
      icon: <FlaskConical className="h-5 w-5" />,
      color: "bg-purple-500"
    },
    {
      name: "Seminar Course",
      type: "Theory", 
      icon: <Users className="h-5 w-5" />,
      color: "bg-orange-500"
    }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Enhanced Course Creation System</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the new and improved course creation workflow with multiple creation methods, 
          smart templates, and bulk operations designed for academic administrators.
        </p>
      </div>

      {/* Creation Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color}`} />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color}`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="outline" className="text-xs mt-1">
                    {index === 0 ? "Fast" : index === 1 ? "Full" : "CSV"}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {feature.features.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={feature.action} className="w-full gap-2">
                {feature.icon}
                Try {feature.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Course Templates
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pre-configured templates for common course types with smart defaults
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded ${template.color}`}>
                  <div className="text-white">
                    {template.icon}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.type} Course</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Improvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">✅ New Features</h4>
              <ul className="space-y-2 text-sm">
                <li>• Multiple creation methods (Quick/Enhanced/Bulk)</li>
                <li>• Smart code generation and suggestions</li>
                <li>• Course templates for rapid setup</li>
                <li>• Bulk creation with CSV import</li>
                <li>• One-click course duplication</li>
                <li>• Real-time validation and previews</li>
                <li>• Enhanced visual design and UX</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">❌ Previous Limitations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Single basic form only</li>
                <li>• Manual course code entry</li>
                <li>• No templates or suggestions</li>
                <li>• One-by-one course creation</li>
                <li>• Basic semester selection</li>
                <li>• Limited course information</li>
                <li>• No duplication feature</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Forms */}
      <QuickCourseForm
        open={showQuickForm}
        onOpenChange={setShowQuickForm}
        onSuccess={handleSuccess}
      />

      <EnhancedCourseForm
        open={showEnhancedForm}
        onOpenChange={setShowEnhancedForm}
        onSuccess={handleSuccess}
      />

      <BulkCourseForm
        open={showBulkForm}
        onOpenChange={setShowBulkForm}
        onSuccess={handleSuccess}
      />
    </div>
  )
}