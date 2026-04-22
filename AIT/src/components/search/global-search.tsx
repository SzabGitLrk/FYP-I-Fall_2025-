"use client"

import { useState, useEffect, useCallback } from "react"
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Users, BookOpen, MapPin, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import Fuse from 'fuse.js'

interface SearchResult {
  id: string
  type: 'program' | 'course' | 'faculty' | 'room' | 'timetable'
  title: string
  subtitle: string
  metadata?: Record<string, any>
  score: number
}

interface GlobalSearchProps {
  trigger?: React.ReactNode
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchData, setSearchData] = useState<any[]>([])
  const router = useRouter()

  // Initialize search data
  useEffect(() => {
    loadSearchData()
  }, [])

  const loadSearchData = async () => {
    try {
      // Fetch all searchable data
      const [programsRes, coursesRes, facultyRes, roomsRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/courses'),
        fetch('/api/faculty'),
        fetch('/api/rooms')
      ])

      const [programs, courses, faculty, rooms] = await Promise.all([
        programsRes.json(),
        coursesRes.json(),
        facultyRes.json(),
        roomsRes.json()
      ])

      const searchableData = [
        ...programs.data.map((p: any) => ({
          id: `program-${p.id}`,
          type: 'program',
          title: p.name,
          subtitle: `${p.semesters?.length || 0} semesters`,
          metadata: p,
          searchText: `${p.name} program`
        })),
        ...courses.data.map((c: any) => ({
          id: `course-${c.id}`,
          type: 'course',
          title: c.name,
          subtitle: `${c.code || 'No code'} • ${c.type} • ${c.semester?.program?.name || 'No program'}`,
          metadata: c,
          searchText: `${c.name} ${c.code || ''} ${c.type} course ${c.semester?.program?.name || ''}`
        })),
        ...faculty.data.map((f: any) => ({
          id: `faculty-${f.id}`,
          type: 'faculty',
          title: f.name,
          subtitle: `${f.email} • ${f.department || 'No department'}`,
          metadata: f,
          searchText: `${f.name} ${f.email} ${f.department || ''} faculty teacher`
        })),
        ...rooms.data.map((r: any) => ({
          id: `room-${r.id}`,
          type: 'room',
          title: r.name,
          subtitle: `${r.type} • Capacity: ${r.capacity}`,
          metadata: r,
          searchText: `${r.name} ${r.type} room ${r.capacity}`
        }))
      ]

      setSearchData(searchableData)
    } catch (error) {
      console.error('Failed to load search data:', error)
    }
  }

  // Debounced search
  const performSearch = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery.trim() || searchData.length === 0) {
        setResults([])
        setLoading(false)
        return
      }

      const fuse = new Fuse(searchData, {
        keys: ['title', 'subtitle', 'searchText'],
        threshold: 0.3,
        includeScore: true,
        minMatchCharLength: 2
      })

      const searchResults = fuse.search(searchQuery).map(result => ({
        ...result.item,
        score: result.score || 0
      }))

      setResults(searchResults.slice(0, 20)) // Limit to 20 results
      setLoading(false)
    }, 300),
    [searchData]
  )

  useEffect(() => {
    setLoading(true)
    performSearch(query)
  }, [query, performSearch])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery("")
    
    // Navigate based on result type
    switch (result.type) {
      case 'program':
        router.push('/admin/programs')
        break
      case 'course':
        router.push('/admin/courses')
        break
      case 'faculty':
        router.push('/admin/faculty')
        break
      case 'room':
        router.push('/admin/rooms')
        break
      default:
        router.push('/admin')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'program':
        return <Building className="h-4 w-4" />
      case 'course':
        return <BookOpen className="h-4 w-4" />
      case 'faculty':
        return <Users className="h-4 w-4" />
      case 'room':
        return <MapPin className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'program':
        return 'bg-blue-100 text-blue-800'
      case 'course':
        return 'bg-green-100 text-green-800'
      case 'faculty':
        return 'bg-purple-100 text-purple-800'
      case 'room':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Keyboard shortcut effect
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild suppressHydrationWarning>
        {trigger || (
          <Button variant="outline" className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64">
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline-flex">Search everything...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-4 shadow-lg max-w-2xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs, courses, faculty, rooms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-search-input
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Searching...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {query ? "No results found." : "Start typing to search..."}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 px-2">Results</div>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md text-left transition-colors"
                  >
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${getTypeColor(result.type)}`}>
                      {result.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}