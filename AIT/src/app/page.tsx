import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, GraduationCap, Users, School, Clock, Zap, BarChart3, BookOpen, Building2, CheckCircle2, ArrowRight, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Timetable Generator</h1>
                <p className="text-xs text-gray-500">Intelligent Academic Scheduling</p>
              </div>
            </div>
            <Link href="/admin">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-20">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Advanced AI Algorithms
          </Badge>
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Smart Academic
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Scheduling</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Generate conflict-free timetables in seconds with student-aware capacity management, 
            faculty preferences, and real-time analytics. Built for modern educational institutions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link href="/admin">
              <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Zap className="h-5 w-5 mr-2" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/admin/timetable">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 hover:bg-gray-50">
                <Calendar className="h-5 w-5 mr-2" />
                View Demo Timetable
              </Button>
            </Link>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">712+</div>
              <div className="text-sm text-gray-600">Students Managed</div>
            </div>
            <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-gray-200">
              <div className="text-3xl font-bold text-indigo-600">162</div>
              <div className="text-sm text-gray-600">Courses Scheduled</div>
            </div>
            <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">3,772</div>
              <div className="text-sm text-gray-600">Active Enrollments</div>
            </div>
            <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-gray-200">
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Conflict-Free</div>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for managing every aspect of academic scheduling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Student Management</CardTitle>
                <CardDescription className="text-base">
                  Complete student lifecycle with enrollment tracking and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">712+ students across 3 programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Individual & bulk enrollment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Real-time enrollment analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">AI-Powered Scheduling</CardTitle>
                <CardDescription className="text-base">
                  Advanced algorithms for conflict-free timetable generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Student-aware capacity matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Faculty preference integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Zero-conflict generation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Department Organization</CardTitle>
                <CardDescription className="text-base">
                  Hierarchical structure for programs, courses, and faculty
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Multi-department support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Faculty assignment & tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Resource allocation analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Faculty Preferences</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive preference system for optimal scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Time & day preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Workload management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Room & course preferences</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <School className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Resource Management</CardTitle>
                <CardDescription className="text-base">
                  Optimize classrooms, labs, and time slots efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">18 rooms with capacity tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Flexible time slot configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Utilization analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-pink-200 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                <CardDescription className="text-base">
                  Real-time insights and comprehensive reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Live dashboard metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Capacity utilization reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">PDF & Excel export</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our intuitive workflow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative">
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  1
                </div>
                <h4 className="font-semibold text-lg mb-2">Setup Structure</h4>
                <p className="text-sm text-gray-600">
                  Configure departments, programs, courses, and faculty members
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
            </div>
            
            <div className="relative">
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border-2 border-indigo-200 hover:shadow-lg transition-all">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  2
                </div>
                <h4 className="font-semibold text-lg mb-2">Enroll Students</h4>
                <p className="text-sm text-gray-600">
                  Register students and assign them to courses with bulk operations
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-indigo-300 to-transparent"></div>
            </div>
            
            <div className="relative">
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border-2 border-purple-200 hover:shadow-lg transition-all">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  3
                </div>
                <h4 className="font-semibold text-lg mb-2">Set Preferences</h4>
                <p className="text-sm text-gray-600">
                  Configure faculty preferences and resource constraints
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-purple-300 to-transparent"></div>
            </div>
            
            <div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-6 border-2 border-green-200 hover:shadow-lg transition-all">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  4
                </div>
                <h4 className="font-semibold text-lg mb-2">Generate & Export</h4>
                <p className="text-sm text-gray-600">
                  Create conflict-free timetables and export to PDF or Excel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-12 text-center text-white mb-20">
          <div className="max-w-3xl mx-auto">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Scheduling?
            </h3>
            <p className="text-lg mb-8 text-blue-100">
              Join educational institutions worldwide using AI-powered timetable generation. 
              Start creating conflict-free schedules in minutes, not hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/admin">
                <Button size="lg" className="px-10 py-6 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Launch Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/admin/timetable">
                <Button variant="outline" size="lg" className="px-10 py-6 text-lg border-2 border-white text-white hover:bg-white/10">
                  <BookOpen className="h-5 w-5 mr-2" />
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">Built with modern technologies</p>
          <div className="flex flex-wrap justify-center gap-6 items-center opacity-60">
            <Badge variant="secondary" className="px-4 py-2">Next.js 15</Badge>
            <Badge variant="secondary" className="px-4 py-2">React 19</Badge>
            <Badge variant="secondary" className="px-4 py-2">TypeScript</Badge>
            <Badge variant="secondary" className="px-4 py-2">Prisma ORM</Badge>
            <Badge variant="secondary" className="px-4 py-2">Tailwind CSS</Badge>
            <Badge variant="secondary" className="px-4 py-2">shadcn/ui</Badge>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">AI Timetable Generator</span>
              </div>
              <p className="text-sm text-gray-600">
                Intelligent academic scheduling for modern educational institutions worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/admin" className="hover:text-blue-600 transition-colors">Admin Dashboard</Link></li>
                <li><Link href="/admin/timetable" className="hover:text-blue-600 transition-colors">View Timetable</Link></li>
                <li><Link href="/admin" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Student Management</li>
                <li>Faculty Preferences</li>
                <li>AI-Powered Scheduling</li>
                <li>Advanced Analytics</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2025 AI Timetable Generator. Built with ❤️ for educational institutions worldwide.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Powered by Next.js, Prisma, and advanced constraint satisfaction algorithms
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
