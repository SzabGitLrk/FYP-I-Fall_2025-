"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReactNode } from "react"

interface StatusBadgeTooltipProps {
  children: ReactNode
  tooltip: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}

export function StatusBadgeTooltip({ 
  children, 
  tooltip, 
  variant = "default", 
  className = "" 
}: StatusBadgeTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className={`cursor-help ${className}`}>
          {children}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}