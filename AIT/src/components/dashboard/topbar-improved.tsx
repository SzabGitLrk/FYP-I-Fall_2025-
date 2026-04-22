"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { 
  Bell, 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Search,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const pageNames: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/departments": "Departments",
  "/admin/programs": "Programs",
  "/admin/semesters": "Semesters", 
  "/admin/courses": "Courses",
  "/admin/faculty": "Faculty",
  "/admin/students": "Students",
  "/admin/faculty-preferences": "Faculty Preferences",
  "/admin/rooms": "Rooms",
  "/admin/timeslots": "Time Slots",
  "/admin/timetable": "Timetable",
  "/admin/export": "PDF Export",
  "/admin/backup": "Backup & Restore",
}

const pageBreadcrumbs: Record<string, string[]> = {
  "/admin": ["Dashboard"],
  "/admin/departments": ["Dashboard", "Departments"],
  "/admin/programs": ["Dashboard", "Programs"],
  "/admin/semesters": ["Dashboard", "Semesters"],
  "/admin/courses": ["Dashboard", "Courses"],
  "/admin/faculty": ["Dashboard", "Faculty"],
  "/admin/students": ["Dashboard", "Students"],
  "/admin/faculty-preferences": ["Dashboard", "Faculty", "Preferences"],
  "/admin/rooms": ["Dashboard", "Rooms"],
  "/admin/timeslots": ["Dashboard", "Time Slots"],
  "/admin/timetable": ["Dashboard", "Timetable"],
  "/admin/export": ["Dashboard", "Export"],
  "/admin/backup": ["Dashboard", "Backup & Restore"],
}

export function ImprovedTopBar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [notifications, setNotifications] = useState(3)
  
  useEffect(() => {
    setMounted(true)
    // Check for dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])
  
  const currentPageName = mounted ? (pageNames[pathname] || "Admin") : "Admin"
  const breadcrumbs = mounted ? (pageBreadcrumbs[pathname] || ["Dashboard"]) : ["Dashboard"]

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    document.documentElement.classList.toggle('dark')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-10 h-16 border-b border-border/50 bg-white/80 backdrop-blur-lg dark:bg-slate-900/80"
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="flex flex-col">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb} className="flex items-center">
                {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                <span className={index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                  {crumb}
                </span>
              </div>
            ))}
          </div>
          
          {/* Page Title */}
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {currentPageName}
            {currentPageName === "Dashboard" && (
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            )}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-muted"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                  >
                    {notifications}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">Timetable Generated</p>
                  <p className="text-xs text-muted-foreground">162 courses scheduled successfully</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">Backup Created</p>
                  <p className="text-xs text-muted-foreground">Database backup completed</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">New Students Added</p>
                  <p className="text-xs text-muted-foreground">25 students registered</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hover:bg-muted"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.div>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 hover:opacity-90"
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-900">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@university.edu</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
