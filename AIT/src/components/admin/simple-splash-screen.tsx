'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimpleSplashScreenProps {
  isLoading: boolean
  message?: string
  hasError?: boolean
  progress?: number
}

export function SimpleSplashScreen({
  isLoading,
  message = 'Loading admin dashboard...',
  hasError = false,
  progress = 0
}: SimpleSplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!isLoading && !hasError) {
      // Start fade out after loading completes
      const timer = setTimeout(() => {
        setFadeOut(true)
      }, 500)
      
      // Hide splash screen after fade out
      const hideTimer = setTimeout(() => {
        setShowSplash(false)
      }, 800)
      
      return () => {
        clearTimeout(timer)
        clearTimeout(hideTimer)
      }
    }
  }, [isLoading, hasError])

  if (!showSplash) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950",
          fadeOut && "opacity-0 transition-opacity duration-300"
        )}
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

          {/* Loading Container */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full",
                hasError 
                  ? "bg-red-100 dark:bg-red-900/30" 
                  : isLoading 
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
              )}>
                {hasError ? (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : isLoading ? (
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {hasError ? "Connection Error" : 
                   isLoading ? "Loading Dashboard" : 
                   "Ready!"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {!hasError && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      isLoading 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : "bg-green-500"
                    )}
                  />
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hasError 
                  ? "Check your connection and try again"
                  : isLoading
                    ? "Please wait while we prepare your dashboard"
                    : "Dashboard ready!"
                }
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}