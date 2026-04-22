"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface SuccessAnimationProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  showConfetti?: boolean
  autoClose?: number
}

export function SuccessAnimation({
  isOpen,
  onClose,
  title,
  message,
  showConfetti = true,
  autoClose = 3000
}: SuccessAnimationProps) {
  useEffect(() => {
    if (isOpen && showConfetti) {
      // Trigger confetti
      const duration = 2000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isOpen, showConfetti])

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(onClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 pointer-events-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full p-4">
                    <CheckCircle2 className="h-16 w-16 text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
                {message && (
                  <p className="text-slate-600">{message}</p>
                )}
              </motion.div>

              {/* Progress Bar */}
              {autoClose && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: autoClose / 1000, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-2xl origin-left"
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

interface ButtonWithSuccessProps {
  onSuccess?: () => void
  successMessage?: string
  isLoading?: boolean
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export function ButtonWithSuccess({
  onSuccess,
  successMessage = "Success!",
  isLoading = false,
  children,
  className,
  onClick,
  disabled,
  type = "button"
}: ButtonWithSuccessProps) {
  const [showSuccess, setShowSuccess] = React.useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      await onClick(e)
      setShowSuccess(true)
      onSuccess?.()
    }
  }

  return (
    <>
      <motion.button
        type={type}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading || disabled}
        onClick={handleClick}
        className={cn(
          "relative px-4 py-2 rounded-lg font-medium transition-colors",
          "bg-primary text-white hover:bg-primary/90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
            />
          </span>
        ) : (
          children
        )}
      </motion.button>

      <SuccessAnimation
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={successMessage}
      />
    </>
  )
}

// Import React at the top
import * as React from "react"
