'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Download, Trash2, Database, Clock, HardDrive, RotateCcw, CheckCircle, AlertTriangle, Upload } from 'lucide-react'

interface BackupInfo {
  id: string
  filePath: string
  size: number
  checksum: string
  createdAt: string
  description?: string
  metadata: {
    totalTables: number
    totalRecords: number
    fileSize: number
  }
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [validating, setValidating] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/backup/list')
      const data = await response.json()
      
      if (data.success) {
        setBackups(data.data)
      } else {
        toast.error('Failed to load backups')
      }
    } catch (error) {
      toast.error('Error loading backups')
      console.error('Error loading backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim() || undefined,
          includeMetrics: true,
          compressionLevel: 6
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Backup created successfully!')
        setDescription('')
        loadBackups()
      } else {
        toast.error(data.error || 'Failed to create backup')
      }
    } catch (error) {
      toast.error('Error creating backup')
      console.error('Error creating backup:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file extension
    if (!file.name.endsWith('.backup')) {
      toast.error('Invalid file type. Please upload a .backup file')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Backup uploaded successfully! You can now restore from it.`)
        loadBackups()
      } else {
        toast.error(data.error || 'Failed to upload backup')
      }
    } catch (error) {
      toast.error('Error uploading backup')
      console.error('Error uploading backup:', error)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/${backupId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupId.slice(-6)}.backup`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Backup download started')
      } else {
        toast.error('Failed to download backup')
      }
    } catch (error) {
      toast.error('Error downloading backup')
      console.error('Error downloading backup:', error)
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Backup deleted successfully')
        loadBackups()
      } else {
        toast.error(data.error || 'Failed to delete backup')
      }
    } catch (error) {
      toast.error('Error deleting backup')
      console.error('Error deleting backup:', error)
    }
  }

  const validateBackup = async (backupId: string) => {
    try {
      setValidating(backupId)
      const response = await fetch(`/api/restore/${backupId}/validate`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.data.isValid) {
          toast.success('Backup is valid and ready for restore')
        } else {
          toast.error(`Backup validation failed: ${data.data.errors.join(', ')}`)
        }
        
        if (data.data.warnings && data.data.warnings.length > 0) {
          toast.warning(`Warnings: ${data.data.warnings.join(', ')}`)
        }
      } else {
        toast.error(data.error || 'Failed to validate backup')
      }
    } catch (error) {
      toast.error('Error validating backup')
      console.error('Error validating backup:', error)
    } finally {
      setValidating(null)
    }
  }

  const restoreBackup = async (backupId: string) => {
    const confirmed = confirm(
      'Are you sure you want to restore from this backup? This will replace ALL current data with the backup data. A pre-restore backup will be created automatically.'
    )
    
    if (!confirmed) return

    try {
      setRestoring(backupId)
      const response = await fetch(`/api/restore/${backupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createPreRestoreBackup: true,
          skipValidation: false
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Database restored successfully!')
        if (data.data.preRestoreBackupId) {
          toast.info(`Pre-restore backup created: ${data.data.preRestoreBackupId.slice(-6)}`)
        }
        loadBackups()
      } else {
        toast.error(data.error || 'Failed to restore from backup')
      }
    } catch (error) {
      toast.error('Error restoring from backup')
      console.error('Error restoring from backup:', error)
    } finally {
      setRestoring(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Backup Management</h1>
        <p className="text-gray-600">Create and manage database backups for your timetable system</p>
      </div>

      {/* Create Backup Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Create New Backup
          </CardTitle>
          <CardDescription>
            Create a complete backup of your timetable database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter a description for this backup..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={createBackup} 
              disabled={creating}
              className="w-full sm:w-auto"
            >
              {creating ? 'Creating Backup...' : 'Create Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Backup Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Backup
          </CardTitle>
          <CardDescription>
            Upload a previously downloaded backup file to restore from it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Click to upload or drag and drop your .backup file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".backup"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={triggerFileUpload}
                disabled={uploading}
                variant="outline"
              >
                {uploading ? 'Uploading...' : 'Select Backup File'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Only .backup files are accepted
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              Available Backups
            </span>
            <Button variant="outline" size="sm" onClick={loadBackups} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </CardTitle>
          <CardDescription>
            {backups.length} backup{backups.length !== 1 ? 's' : ''} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No backups found. Create your first backup above.
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{formatDate(backup.createdAt)}</span>
                      </div>
                      {backup.description && (
                        <p className="text-gray-600 mb-2">{backup.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(backup.size)}</span>
                        <span>{backup.metadata.totalRecords} records</span>
                        <span>{backup.metadata.totalTables} tables</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateBackup(backup.id)}
                        disabled={validating === backup.id}
                        title="Validate backup"
                      >
                        {validating === backup.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                        disabled={restoring === backup.id}
                        className="text-blue-600 hover:text-blue-700"
                        title="Restore from backup"
                      >
                        {restoring === backup.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.id)}
                        title="Download backup"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete backup"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}