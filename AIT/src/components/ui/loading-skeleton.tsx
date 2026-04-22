"use client"

import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  rows?: number
  cols?: number
  type?: 'card' | 'table' | 'grid' | 'text'
}

export function LoadingSkeleton({ 
  className, 
  rows = 3, 
  cols = 1, 
  type = 'card' 
}: LoadingSkeletonProps) {
  if (type === 'table') {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Table Header */}
        <div className="flex space-x-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded flex-1 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'grid') {
    return (
      <div className={cn("grid gap-4", className)}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  // Default card type
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function TimetableGridSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="grid grid-cols-8 gap-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
      {/* Time slot skeletons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-2">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-3">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  )
}