"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "@/components/search/global-search"
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
  Database
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    name: "Departments",
    href: "/admin/departments",
    icon: Building2,
  },
  {
    name: "Programs",
    href: "/admin/programs",
    icon: GraduationCap,
  },
  {
    name: "Semesters", 
    href: "/admin/semesters",
    icon: Calendar,
  },
  {
    name: "Courses",
    href: "/admin/courses", 
    icon: BookOpen,
  },
  {
    name: "Faculty",
    href: "/admin/faculty",
    icon: Users,
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: UserCheck,
  },
  {
    name: "Faculty Preferences",
    href: "/admin/faculty-preferences",
    icon: Users,
  },
  {
    name: "Rooms",
    href: "/admin/rooms",
    icon: School,
  },
  {
    name: "Time Slots",
    href: "/admin/timeslots",
    icon: Clock,
  },
  {
    name: "Timetable",
    href: "/admin/timetable",
    icon: CalendarDays,
  },
  {
    name: "PDF Export",
    href: "/admin/export",
    icon: Download,
  },
  {
    name: "Backup & Restore",
    href: "/admin/backup",
    icon: Database,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          AI Timetable Generator
        </h1>
      </div>
      
      {/* Global Search */}
      <div className="px-3 py-4 border-b border-gray-200">
        <GlobalSearch />
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 shrink-0",
                  isActive ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          University Management System
        </div>
      </div>
    </div>
  )
}