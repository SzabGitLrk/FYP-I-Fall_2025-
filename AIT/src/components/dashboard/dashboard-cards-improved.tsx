"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Users, 
  BookOpen, 
  Calendar, 
  School,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon: React.ElementType
  gradient: string
  description?: string
  action?: {
    label: string
    href: string
  }
  index: number
}

function DashboardCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  description,
  action,
  index
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group h-full"
    >
      <Card className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 bg-white shadow-md hover:shadow-2xl transition-all duration-500 dark:bg-slate-800 h-full">
        {/* Gradient Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />

        {/* Content */}
        <div className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6">
            <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              {title}
            </CardTitle>
            <motion.div
              className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:shadow-xl transition-shadow`}
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="h-5 w-5 text-white" />
            </motion.div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex items-baseline justify-between mb-2">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
              >
                <div className="text-4xl font-bold text-foreground">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </motion.div>
              {change && (
                <motion.div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                    change.type === 'increase' ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {change.type === 'increase' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-sm font-bold ${
                    change.type === 'increase' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {change.value > 0 ? '+' : ''}{change.value}%
                  </span>
                </motion.div>
              )}
            </div>

            {description && (
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                {description}
              </p>
            )}

            {change && (
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                <span>{change.type === 'increase' ? '↑' : '↓'}</span>
                <span>{change.type === 'increase' ? 'Up' : 'Down'} from {change.period}</span>
              </p>
            )}

            {action && (
              <Link href={action.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`mt-2 w-full justify-between group-hover:bg-gradient-to-r group-hover:${gradient} group-hover:text-white transition-all duration-300`}
                >
                  <span className="text-xs font-semibold">{action.label}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </div>

        {/* Hover Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none rounded-lg`} />
      </Card>
    </motion.div>
  )
}

interface DashboardCardsProps {
  stats: {
    totalStudents: number
    totalCourses: number
    totalFaculty: number
    totalRooms: number
    scheduledCourses?: number
    lastGenerated?: string
  }
}

export function ImprovedDashboardCards({ stats }: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      change: {
        value: 12,
        type: 'increase' as const,
        period: 'last month'
      },
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      description: "Active enrollments",
      action: {
        label: "View Students",
        href: "/admin/students"
      }
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      change: {
        value: 8,
        type: 'increase' as const,
        period: 'last semester'
      },
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      description: "Available courses",
      action: {
        label: "Manage Courses",
        href: "/admin/courses"
      }
    },
    {
      title: "Faculty Members",
      value: stats.totalFaculty,
      change: {
        value: 5,
        type: 'increase' as const,
        period: 'last quarter'
      },
      icon: Users,
      gradient: "from-emerald-500 to-teal-500",
      description: "Teaching staff",
      action: {
        label: "View Faculty",
        href: "/admin/faculty"
      }
    },
    {
      title: "Available Rooms",
      value: stats.totalRooms,
      icon: School,
      gradient: "from-orange-500 to-red-500",
      description: "Classrooms & labs",
      action: {
        label: "Manage Rooms",
        href: "/admin/rooms"
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <span className="text-4xl">👋</span>
                </motion.div>
                <h1 className="text-3xl font-bold">
                  Welcome back, Admin!
                </h1>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">
                Your timetable management system is running smoothly. Here's your overview for today.
              </p>
            </div>
            <div className="hidden lg:block">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="h-24 w-24 text-white/30" />
              </motion.div>
            </div>
          </div>
          
          {stats.lastGenerated && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Last generated: {stats.lastGenerated}
              </Badge>
              {stats.scheduledCourses !== undefined && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  {stats.scheduledCourses}/{stats.totalCourses} courses scheduled
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <DashboardCard key={card.title} {...card} index={index} />
        ))}
      </div>
    </div>
  )
}
