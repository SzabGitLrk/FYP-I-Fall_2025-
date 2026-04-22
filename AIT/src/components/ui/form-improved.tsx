"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  isLoading?: boolean
  isValid?: boolean
  showCharCount?: boolean
  maxLength?: number
}

export function FloatingLabelInput({
  label,
  error,
  helperText,
  isLoading,
  isValid,
  showCharCount,
  maxLength,
  className,
  ...props
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [value, setValue] = React.useState(props.value || "")
  const hasValue = value !== ""

  return (
    <div className="relative">
      <div className="relative">
        <Input
          {...props}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            props.onChange?.(e)
          }}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          maxLength={maxLength}
          className={cn(
            "peer pt-6 pb-2 transition-all",
            error && "border-red-500 focus-visible:ring-red-500",
            isValid && "border-emerald-500 focus-visible:ring-emerald-500",
            className
          )}
        />
        
        <Label
          className={cn(
            "absolute left-3 transition-all pointer-events-none",
            isFocused || hasValue
              ? "top-1.5 text-xs text-muted-foreground"
              : "top-3.5 text-sm text-muted-foreground",
            error && "text-red-500",
            isValid && "text-emerald-500"
          )}
        >
          {label}
        </Label>

        {/* Status Icons */}
        <div className="absolute right-3 top-3.5 flex items-center space-x-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isValid && !isLoading && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Check className="h-4 w-4 text-emerald-500" />
            </motion.div>
          )}
          {error && !isLoading && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Helper Text / Error / Character Count */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-xs text-red-500 flex items-center"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              {helperText}
            </motion.p>
          ) : (
            <div />
          )}
        </AnimatePresence>

        {showCharCount && maxLength && (
          <span className={cn(
            "text-xs transition-colors",
            value.toString().length > maxLength * 0.9
              ? "text-amber-500"
              : "text-muted-foreground"
          )}>
            {value.toString().length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export function FormSection({ title, description, children, icon }: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-start space-x-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 pl-0 md:pl-11">
        {children}
      </div>
    </motion.div>
  )
}

interface FormStepIndicatorProps {
  steps: string[]
  currentStep: number
}

export function FormStepIndicator({ steps, currentStep }: FormStepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center flex-1">
            <motion.div
              initial={false}
              animate={{
                scale: index === currentStep ? 1.1 : 1,
                backgroundColor: index <= currentStep ? "rgb(99, 102, 241)" : "rgb(226, 232, 240)"
              }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                index <= currentStep ? "text-white" : "text-slate-400"
              )}
            >
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </motion.div>
            <span className={cn(
              "text-xs mt-2 text-center",
              index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 mb-6 bg-slate-200 relative overflow-hidden">
              <motion.div
                initial={false}
                animate={{
                  width: index < currentStep ? "100%" : "0%"
                }}
                transition={{ duration: 0.3 }}
                className="absolute inset-y-0 left-0 bg-primary"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
