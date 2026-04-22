'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Users, 
  BookOpen, 
  GraduationCap,
  Building2,
  Calendar,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type LoadingState = 
  | 'initializing'
  | 'connecting_database'
  | 'fetching_data'
  | 'processing'
  | 'complete'
  | 'error'
  | 'offline'

export interface SplashScreenProps {
  isLoading: boolean
  progress?: number
  state?: LoadingState
  message?: string
  dataLoaded?: {
    students: boolean
    courses: boolean
    faculty: boolean
    rooms: boolean
    departments: boolean
    programs: boolean
  }
  onRetry?: () => void
  onComplete?: () => void
}

const LOADING_STEPS = [
  { key: 'initializing', label: 'Initializing System', icon: Loader2 },
  { key: 'connecting_database', label: 'Connecting to Database', icon: Database },
  { key: 'fetching_data', label: 'Fetching Data', icon: Users },
  { key: 'processing', label: 'Processing Information', icon: BookOpen },
  { key: 'complete', label: 'Ready', icon: CheckCircle2 },
] as const

export function AdminSplashScreen({
  isLoading,
  progress = 0,
  state = 'initializing',
  message,
  dataLoaded,
  onRetry,
  onComplete
}: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showRetry, setShowRetry] = useState(false)

  // Calculate progress based on state
  const calculatedProgress = progress > 0 ? progress : 
    state === 'initializing' ? 10 :
    state === 'connecting_database' ? 30 :
    state === 'fetching_data' ? 60 :
    state === 'processing' ? 85 :
    state === 'complete' ? 100 : 0

  // Update current step based on state
  useEffect(() => {
    const stepIndex = LOADING_STEPS.findIndex(step => step.key === state)
    if (stepIndex >= 0) {
      setCurrentStepIndex(stepIndex)
    }
  }, [state])

  // Handle completion
  useEffect(() => {
    if (state === 'complete' && !isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false)
        onComplete?.()
      }, 1000) // Show success state for 1 second before fading
      return () => clearTimeout(timer)
    }
  }, [state, isLoading, onComplete])

  // Show retry option on error after delay
  useEffect(() => {
    if (state === 'error') {
      const timer = setTimeout(() => {
        setShowRetry(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setShowRetry(false)
    }
  }, [state])

  // Don't show splash if not loading and not in error state
  if (!showSplash && !isLoading && state !== 'error' && state !== 'offline') {
    return null
  }

  const CurrentIcon = LOADING_STEPS[currentStepIndex]?.icon || Loader2
  const isError = state === 'error'
  const isOffline = state === 'offline'
  const isComplete = state === 'complete'

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950"
        >
          <div className="w-full max-w-md mx-4">
            {/* Logo/Header */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Timetable Generator
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Admin Dashboard
              </p>
            </motion.div>

            {/* Progress Container */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6"
            >
              {/* Current Step */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  isError ? "bg-red-100 dark:bg-red-900/30" :
                  isOffline ? "bg-yellow-100 dark:bg-yellow-900/30" :
                  isComplete ? "bg-green-100 dark:bg-green-900/30" :
                  "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {isError ? (
                    <AlertCircle className={cn(
                      "h-5 w-5",
                      isError ? "text-red-600 dark:text-red-400" :
                      isOffline ? "text-yellow-600 dark:text-yellow-400" :
                      isComplete ? "text-green-600 dark:text-green-400" :
                      "text-blue-600 dark:text-blue-400"
                    )} />
                  ) : (
                    <CurrentIcon className={cn(
                      "h-5 w-5",
                      isError ? "text-red-600 dark:text-red-400" :
                      isOffline ? "text-yellow-600 dark:text-yellow-400" :
                      isComplete ? "text-green-600 dark:text-green-400" :
                      "text-blue-600 dark:text-blue-400",
                      !isComplete && "animate-spin"
                    )} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {isError ? "Connection Error" : 
                     isOffline ? "Offline Mode" : 
                     LOADING_STEPS[currentStepIndex]?.label || "Loading..."}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message || (isError ? "Unable to connect to database" :
                      isOffline ? "Using demo data for now" :
                      "Preparing your dashboard...")}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {!isError && !isOffline && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {calculatedProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calculatedProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        isComplete ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-purple-500"
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Data Loading Status */}
              {dataLoaded && !isError && !isOffline && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Object.entries(dataLoaded).map(([key, loaded]) => {
                    const icons = {
                      students: Users,
                      courses: BookOpen,
                      faculty: GraduationCap,
                      rooms: Building2,
                      departments: Building2,
                      programs: GraduationCap
                    }
                    const Icon = icons[key as keyof typeof icons] || CheckCircle2
                    const label = key.charAt(0).toUpperCase() + key.slice(1)
                    
                    return (
                      <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <Icon className={cn(
                          "h-4 w-4",
                          loaded ? "text-green-500" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "text-sm",
                          loaded ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {label}
                        </span>
                        {loaded && (
                          <CheckCircle2 className="h-3 w-3 ml-auto text-green-500" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Error/Offline Actions */}
              {(isError || isOffline) && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {isError 
                        ? "The system couldn't connect to the database. You can retry or continue in offline mode."
                        : "You're currently in offline mode. Some features may be limited."
                      }
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isError && showRetry && (
                      <button
                        onClick={onRetry}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Retry Connection
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowSplash(false)
                        onComplete?.()
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Continue Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Steps */}
              {!isError && !isOffline && (
                <div className="space-y-2">
                  {LOADING_STEPS.map((step, index) => {
                    const isActive = index === currentStepIndex
                    const isCompleted = index < currentStepIndex
                    const Icon = step.icon
                    
                    return (
                      <div
                        key={step.key}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg transition-colors",
                          isActive ? "bg-blue-50 dark:bg-blue-900/20" :
                          isCompleted ? "bg-green-50 dark:bg-green-900/20" :
                          "bg-gray-50 dark:bg-gray-900/20"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full",
                          isActive ? "bg-blue-100 dark:bg-blue-800" :
                          isCompleted ? "bg-green-100 dark:bg-green-800" :
                          "bg-gray-100 dark:bg-gray-800"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Icon className={cn(
                              "h-3 w-3",
                              isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400",
                              isActive && !isComplete && "animate-spin"
                            )} />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm",
                          isActive ? "text-blue-700 dark:text-blue-300 font-medium" :
                          isCompleted ? "text-green-700 dark:text-green-300" :
                          "text-gray-500 dark:text-gray-400"
                        )}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isComplete ? "Dashboard ready!" : 
                 isError ? "Check your connection and try again" :
                 "Please wait while we prepare your dashboard"}
              </p>
              {!isError && !isOffline && !isComplete && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Estimated time: {calculatedProgress < 50 ? "30 seconds" : "10 seconds"}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}