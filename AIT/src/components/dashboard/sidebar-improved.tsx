"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "@/components/search/global-search"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Home, 
  School, 
  Users, 
  Clock,
  CalendarDays,
  UserCheck,
  Building2,
  Download,
  Database,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  HelpCircle
} from "lucide-react"

const navigationSections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: Home },
    ]
  },
  {
    title: "Academic",
    items: [
      { name: "Departments", href: "/admin/departments", icon: Building2 },
      { name: "Programs", href: "/admin/programs", icon: GraduationCap },
      { name: "Semesters", href: "/admin/semesters", icon: Calendar },
      { name: "Courses", href: "/admin/courses", icon: BookOpen },
    ]
  },
  {
    title: "People",
    items: [
      { name: "Faculty", href: "/admin/faculty", icon: Users },
      { name: "Students", href: "/admin/students", icon: UserCheck },
      { name: "Enrollments", href: "/admin/enrollments", icon: GraduationCap },
      { name: "Faculty Preferences", href: "/admin/faculty-preferences", icon: Sparkles },
    ]
  },
  {
    title: "Resources",
    items: [
      { name: "Rooms", href: "/admin/rooms", icon: School },
      { name: "Time Slots", href: "/admin/timeslots", icon: Clock },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Timetable", href: "/admin/timetable", icon: CalendarDays },
      { name: "PDF Export", href: "/admin/export", icon: Download },
      { name: "Backup & Restore", href: "/admin/backup", icon: Database },
    ]
  }
]

export function ImprovedSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex h-full flex-col border-r bg-gradient-to-b from-white via-gray-50 to-white shadow-xl"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex h-16 items-center justify-between px-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">AI Timetable</h1>
                <p className="text-xs text-white/90">Smart Generator</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative px-3 py-4 border-b"
        >
          <GlobalSearch />
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {navigationSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.05 }}
          >
            {!isCollapsed && (
              <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                {section.title}
              </h3>
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
                      )}
                    >
                      {/* Active indicator glow */}
                      {isActive && (
                        <motion.div
                          layoutId="activeGlow"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      {/* Icon with background */}
                      <div className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                        isActive 
                          ? "bg-white/20 shadow-inner" 
                          : "bg-gray-100 group-hover:bg-gray-200"
                      )}>
                        <item.icon
                          className={cn(
                            "relative h-5 w-5 shrink-0 transition-colors",
                            isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
                          )}
                        />
                      </div>
                      
                      {!isCollapsed && (
                        <span className={cn(
                          "relative z-10 font-semibold", 
                          isActive ? "text-white" : "text-gray-700 group-hover:text-gray-900"
                        )}>
                          {item.name}
                        </span>
                      )}
                      
                      {isActive && !isCollapsed && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="relative z-10 ml-auto h-2 w-2 rounded-full bg-white shadow-lg"
                        />
                      )}
                      
                      {/* Hover gradient effect */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50 group-hover:via-purple-50 group-hover:to-pink-50 transition-all duration-300" />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* Footer */}
      <div className="relative border-t p-4 bg-gray-50">
        {!isCollapsed ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 mr-2 transition-all">
                <Settings className="h-4 w-4" />
              </div>
              <span className="font-medium">Settings</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 mr-2 transition-all">
                <HelpCircle className="h-4 w-4" />
              </div>
              <span className="font-medium">Help & Support</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
