"use client"

import { ReactNode } from "react"
import { ImprovedSidebar } from "./sidebar-improved"
import { ImprovedTopBar } from "./topbar-improved"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex bg-gray-50" suppressHydrationWarning>
      {/* Sidebar */}
      <ImprovedSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <ImprovedTopBar />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}