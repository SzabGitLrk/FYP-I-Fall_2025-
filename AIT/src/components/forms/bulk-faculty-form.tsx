"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  User, 
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Users,
  Building,
  Award
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface BulkFaculty {
  id: string
  name: string
  email: string
  phone: string
  designation: string
  employmentType: "PERMANENT" | "CONTRACT"
  departmentId?: number
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface Department {
  id: number
  name: string
  code?: string
}

interface BulkFacultyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const designations = [
  "Professor",
  "Associate Professor", 
  "Assistant Professor",
  "Lecturer",
  "Senior Lecturer",
  "Visiting Professor",
  "Adjunct Professor",
  "Research Associate",
  "Teaching Assistant",
  "Lab Instructor"
]

export function BulkFacultyForm({ 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkFacultyFormProps) {
  const [faculty, setFaculty] = useState<BulkFaculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [csvInput, setCsvInput] = useState("")
  const [showCsvInput, setShowCsvInput] = useState(false)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/departments')
      const result = await response.json()
      
      if (result.success) {
        setDepartments(result.data)
      }
    } catch (error) {
      toast.error('Failed to fetch departments')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchData()
      setFaculty([])
      setCsvInput("")
      setShowCsvInput(false)
    }
  }, [open])

  const addEmptyFaculty = () => {
    const newFaculty: BulkFaculty = {
      id: Date.now().toString(),
      name: "",
      email: "",
      phone: "",
      designation: "",
      employmentType: "PERMANENT",
      status: 'pending'
    }
    setFaculty([...faculty, newFaculty])
  }

  const updateFaculty = (id: string, updates: Partial<BulkFaculty>) => {
    setFaculty(faculty.map(fac => 
      fac.id === id 
        ? { ...fac, ...updates, status: 'pending' as const }
        : fac
    ))
  }

  const removeFaculty = (id: string) => {
    setFaculty(faculty.filter(fac => fac.id !== id))
  }

  const parseCsvInput = () => {
    if (!csvInput.trim()) {
      toast.error("Please enter CSV data")
      return
    }

    try {
      const lines = csvInput.trim().split('\n')
      const newFaculty: BulkFaculty[] = []

      lines.forEach((line, index) => {
        const [name, email, phone, designation, employmentType, departmentName] = line.split(',').map(s => s.trim())
        
        if (!name || !email) return

        // Find department by name (basic matching)
        const department = departments.find(d => 
          d.name.toLowerCase().includes(departmentName?.toLowerCase() || '') ||
          departmentName?.toLowerCase().includes(d.name.toLowerCase())
        )

        const empType = employmentType?.toLowerCase() === 'contract' ? 'CONTRACT' : 'PERMANENT'

        newFaculty.push({
          id: `csv-${Date.now()}-${index}`,
          name: name,
          email: email,
          phone: phone || "",
          designation: designation || "",
          employmentType: empType,
          departmentId: department?.id,
          status: 'pending'
        })
      })

      setFaculty([...faculty, ...newFaculty])
      setCsvInput("")
      setShowCsvInput(false)
      toast.success(`Added ${newFaculty.length} faculty members from CSV`)
    } catch (error) {
      toast.error("Failed to parse CSV data")
    }
  }

  const createAllFaculty = async () => {
    if (faculty.length === 0) {
      toast.error("No faculty members to create")
      return
    }

    // Validate all faculty
    const invalidFaculty = faculty.filter(fac => 
      !fac.name.trim() || !fac.email.trim()
    )

    if (invalidFaculty.length > 0) {
      toast.error(`${invalidFaculty.length} faculty members have missing required fields`)
      return
    }

    setIsCreating(true)
    let successCount = 0
    let errorCount = 0

    // Create faculty one by one to handle individual errors
    for (const fac of faculty) {
      try {
        const response = await fetch('/api/faculty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fac.name,
            email: fac.email,
            phone: fac.phone || null,
            designation: fac.designation || null,
            employmentType: fac.employmentType,
            departmentId: fac.departmentId || null,
          }),
        })

        const result = await response.json()

        if (result.success) {
          updateFaculty(fac.id, { status: 'success' })
          successCount++
        } else {
          updateFaculty(fac.id, { 
            status: 'error', 
            error: result.error || 'Failed to create faculty member' 
          })
          errorCount++
        }
      } catch (error) {
        updateFaculty(fac.id, { 
          status: 'error', 
          error: 'Network error' 
        })
        errorCount++
      }
    }

    setIsCreating(false)

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} faculty members`)
      if (errorCount === 0) {
        onSuccess()
        onOpenChange(false)
      }
    }

    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} faculty members`)
    }
  }

  const downloadTemplate = () => {
    const csvContent = [
      "Name,Email,Phone,Designation,Employment Type,Department",
      "Dr. John Smith,john.smith@university.edu,+1-555-0123,Professor,Permanent,Computer Science",
      "Ms. Sarah Johnson,sarah.johnson@university.edu,+1-555-0124,Assistant Professor,Contract,Mathematics",
      "Dr. Michael Brown,michael.brown@university.edu,+1-555-0125,Associate Professor,Permanent,Physics"
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_faculty_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Add Faculty Members
          </DialogTitle>
          <DialogDescription>
            Add multiple faculty members at once by entering them individually or importing from CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addEmptyFaculty}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Faculty
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCsvInput(!showCsvInput)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>

            <div className="ml-auto">
              <Badge variant="outline">
                {faculty.length} faculty members
              </Badge>
            </div>
          </div>

          {/* CSV Input */}
          <AnimatePresence>
            {showCsvInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">CSV Import</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="csv-input">CSV Data</Label>
                      <Textarea
                        id="csv-input"
                        placeholder="Name,Email,Phone,Designation,Employment Type,Department&#10;Dr. John Smith,john.smith@university.edu,+1-555-0123,Professor,Permanent,Computer Science&#10;Ms. Sarah Johnson,sarah.johnson@university.edu,+1-555-0124,Assistant Professor,Contract,Mathematics"
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        className="min-h-[100px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: Name, Email, Phone, Designation, Employment Type (Permanent/Contract), Department
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={parseCsvInput}
                        disabled={!csvInput.trim()}
                      >
                        Parse CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCsvInput("")
                          setShowCsvInput(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Faculty List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {faculty.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No faculty members added</h3>
                    <p className="text-muted-foreground mb-4">
                      Add faculty members individually or import from CSV to get started.
                    </p>
                    <Button onClick={addEmptyFaculty} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Faculty Member
                    </Button>
                  </div>
                </Card>
              ) : (
                faculty.map((fac, index) => (
                  <motion.div
                    key={fac.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`relative ${
                      fac.status === 'success' ? 'border-green-200 bg-green-50/50' :
                      fac.status === 'error' ? 'border-red-200 bg-red-50/50' :
                      'border-border'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Status Indicator */}
                          <div className="mt-2">
                            {fac.status === 'success' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {fac.status === 'error' && (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            {fac.status === 'pending' && (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>

                          {/* Faculty Form */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3">
                            <div>
                              <Label className="text-xs">Name *</Label>
                              <Input
                                placeholder="Full name"
                                value={fac.name}
                                onChange={(e) => updateFaculty(fac.id, { name: e.target.value })}
                                disabled={fac.status === 'success'}
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Email *</Label>
                              <Input
                                type="email"
                                placeholder="Email address"
                                value={fac.email}
                                onChange={(e) => updateFaculty(fac.id, { email: e.target.value })}
                                disabled={fac.status === 'success'}
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Phone</Label>
                              <Input
                                placeholder="Phone number"
                                value={fac.phone}
                                onChange={(e) => updateFaculty(fac.id, { phone: e.target.value })}
                                disabled={fac.status === 'success'}
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Designation</Label>
                              <Select
                                value={fac.designation}
                                onValueChange={(value) => updateFaculty(fac.id, { designation: value })}
                                disabled={fac.status === 'success'}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {designations.map((designation) => (
                                    <SelectItem key={designation} value={designation}>
                                      <div className="flex items-center gap-2">
                                        <Award className="h-3 w-3" />
                                        {designation}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Employment</Label>
                              <Select
                                value={fac.employmentType}
                                onValueChange={(value: "PERMANENT" | "CONTRACT") => updateFaculty(fac.id, { employmentType: value })}
                                disabled={fac.status === 'success'}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                                  <SelectItem value="CONTRACT">Contract</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Department</Label>
                              <Select
                                value={fac.departmentId?.toString() || "none"}
                                onValueChange={(value) => updateFaculty(fac.id, { departmentId: value === "none" ? undefined : parseInt(value) })}
                                disabled={fac.status === 'success' || loadingData}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {departments.map((department) => (
                                    <SelectItem key={department.id} value={department.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <Building className="h-3 w-3" />
                                        {department.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFaculty(fac.id)}
                            disabled={fac.status === 'success'}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Error Message */}
                        {fac.status === 'error' && fac.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {fac.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={createAllFaculty}
            disabled={isCreating || faculty.length === 0 || loadingData}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create {faculty.length} Faculty Members
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}