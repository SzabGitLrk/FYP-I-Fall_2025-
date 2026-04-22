import { toast } from "sonner"
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from "lucide-react"

export const toastUtils = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    })
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    })
  },

  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
    })
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    })
  },

  // Specialized toasts for common actions
  timetableGenerated: (count: number) => {
    toastUtils.success(
      "Timetable Generated Successfully!",
      `${count} sessions scheduled across all 7 days with zero conflicts.`
    )
  },

  timetableCleared: () => {
    toastUtils.info(
      "Timetable Cleared",
      "All scheduled sessions have been removed."
    )
  },

  entityCreated: (entityType: string, name: string) => {
    toastUtils.success(
      `${entityType} Created`,
      `${name} has been successfully added to the system.`
    )
  },

  entityUpdated: (entityType: string, name: string) => {
    toastUtils.success(
      `${entityType} Updated`,
      `${name} has been successfully updated.`
    )
  },

  entityDeleted: (entityType: string, name: string) => {
    toastUtils.success(
      `${entityType} Deleted`,
      `${name} has been removed from the system.`
    )
  },

  exportStarted: (type: string) => {
    return toastUtils.loading(
      `Exporting ${type}...`,
      "Please wait while we prepare your file."
    )
  },

  exportCompleted: (type: string, filename: string) => {
    toastUtils.success(
      `${type} Export Complete`,
      `File saved as ${filename}`
    )
  },
}