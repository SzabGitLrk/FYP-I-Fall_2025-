'use client'

import { useState, useEffect, ReactNode } from 'react'
import { AdminSplashScreen, LoadingState } from './admin-splash-screen'
import { DashboardSkeleton } from './dashboard-skeletons'
import { toast } from 'sonner'

interface EnhancedAdminDashboardProps {
  children: ReactNode
  onLoadComplete?: () => void
  enableSplashScreen?: boolean
  minDisplayTime?: number // Minimum time to show splash screen (ms)
}

export function EnhancedAdminDashboard({
  children,
  onLoadComplete,
  enableSplashScreen = true,
  minDisplayTime = 1500
}: EnhancedAdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>('initializing')
  const [progress, setProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [dataLoaded, setDataLoaded] = useState({
    students: false,
    courses: false,
    faculty: false,
    rooms: false,
    departments: false,
    programs: false
  })
  const [hasError, setHasError] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Simulate loading progress
  useEffect(() => {
    if (!enableSplashScreen) {
      setIsLoading(false)
      setShowContent(true)
      return
    }

    const loadDashboard = async () => {
      try {
        // Step 1: Initializing
        setLoadingState('initializing')
        setLoadingMessage('Starting up the dashboard...')
        setProgress(10)
        await delay(300)

        // Step 2: Check database connection
        setLoadingState('connecting_database')
        setLoadingMessage('Checking database connection...')
        setProgress(20)
        
        const dbConnected = await testDatabaseConnection()
        if (!dbConnected) {
          setIsOffline(true)
          setLoadingState('offline')
          setLoadingMessage('Using demo data for now')
          setProgress(40)
          await delay(800)
          setProgress(100)
          return
        }

        // Step 3: Fetch data
        setLoadingState('fetching_data')
        setLoadingMessage('Fetching dashboard data...')
        setProgress(30)

        // Simulate fetching different data types
        const dataTypes = [
          { key: 'students', label: 'Student data', delay: 200 },
          { key: 'courses', label: 'Course data', delay: 300 },
          { key: 'faculty', label: 'Faculty data', delay: 250 },
          { key: 'rooms', label: 'Room data', delay: 150 },
          { key: 'departments', label: 'Department data', delay: 100 },
          { key: 'programs', label: 'Program data', delay: 180 }
        ] as const

        for (const dataType of dataTypes) {
          setLoadingMessage(`Loading ${dataType.label}...`)
          await delay(dataType.delay)
          setDataLoaded(prev => ({ ...prev, [dataType.key]: true }))
          setProgress(prev => Math.min(prev + 10, 80))
        }

        // Step 4: Processing
        setLoadingState('processing')
        setLoadingMessage('Processing and organizing data...')
        setProgress(85)
        await delay(500)

        // Step 5: Complete
        setLoadingState('complete')
        setLoadingMessage('Dashboard ready!')
        setProgress(100)
        await delay(800) // Show success state briefly

        // Complete loading
        setIsLoading(false)
        onLoadComplete?.()
        
        // Show content with fade-in
        setTimeout(() => {
          setShowContent(true)
          toast.success('Dashboard loaded successfully')
        }, 300)

      } catch (error) {
        console.error('Dashboard loading error:', error)
        setHasError(true)
        setLoadingState('error')
        setLoadingMessage('Failed to load dashboard data')
        toast.error('Failed to load dashboard. Please try again.')
      }
    }

    loadDashboard()
  }, [enableSplashScreen, onLoadComplete])

  // Test database connection (simulated)
  const testDatabaseConnection = async (): Promise<boolean> => {
    try {
      // In a real implementation, this would make an API call
      await delay(800) // Simulate connection test
      return Math.random() > 0.1 // 90% success rate for demo
    } catch (error) {
      return false
    }
  }

  // Utility delay function
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Handle retry
  const handleRetry = () => {
    setHasError(false)
    setIsOffline(false)
    setProgress(0)
    setDataLoaded({
      students: false,
      courses: false,
      faculty: false,
      rooms: false,
      departments: false,
      programs: false
    })
    setIsLoading(true)
    setShowContent(false)
  }

  // Handle completion
  const handleComplete = () => {
    setIsLoading(false)
    setShowContent(true)
  }

  // If splash screen is disabled, show content immediately
  if (!enableSplashScreen) {
    return <>{children}</>
  }

  return (
    <>
      {/* Splash Screen */}
      <AdminSplashScreen
        isLoading={isLoading}
        progress={progress}
        state={loadingState}
        message={loadingMessage}
        dataLoaded={dataLoaded}
        onRetry={handleRetry}
        onComplete={handleComplete}
      />

      {/* Content Area */}
      <div className={showContent ? 'opacity-100 transition-opacity duration-500' : 'opacity-0'}>
        {showContent ? (
          children
        ) : (
          <DashboardSkeleton />
        )}
      </div>
    </>
  )
}

// Hook for managing dashboard loading state
export function useDashboardLoading() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>('initializing')
  const [progress, setProgress] = useState(0)

  const startLoading = () => {
    setIsLoading(true)
    setLoadingState('initializing')
    setProgress(0)
  }

  const updateLoading = (state: LoadingState, progressValue: number, message?: string) => {
    setLoadingState(state)
    setProgress(progressValue)
    // You could also trigger toast notifications here
  }

  const completeLoading = () => {
    setLoadingState('complete')
    setProgress(100)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const setError = (message: string) => {
    setLoadingState('error')
    setProgress(0)
    toast.error(message)
  }

  return {
    isLoading,
    loadingState,
    progress,
    startLoading,
    updateLoading,
    completeLoading,
    setError
  }
}