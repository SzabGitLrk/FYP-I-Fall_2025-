"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Bell, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"

const pageNames: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/programs": "Programs",
  "/admin/semesters": "Semesters", 
  "/admin/courses": "Courses",
  "/admin/faculty": "Faculty",
  "/admin/rooms": "Rooms",
  "/admin/timeslots": "Time Slots",
  "/admin/timetable": "Timetable",
}

export function TopBar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const currentPageName = mounted ? (pageNames[pathname] || "Admin") : "Admin"

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {currentPageName}
        </h2>
        <p className="text-sm text-gray-500">
          Manage your university timetable system
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}