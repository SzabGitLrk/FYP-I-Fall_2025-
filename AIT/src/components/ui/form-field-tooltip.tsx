"use client"

import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FormFieldTooltipProps {
  content: string
  className?: string
}

export function FormFieldTooltip({ content, className = "" }: FormFieldTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className={`h-4 w-4 text-muted-foreground cursor-help ${className}`} />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  )
}