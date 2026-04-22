"use client"

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.metaKey === !!shortcut.metaKey
      )
    })

    if (matchingShortcut) {
      event.preventDefault()
      matchingShortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useGlobalShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus search',
      category: 'Navigation'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or clear focus
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.blur) {
          activeElement.blur()
        }
      },
      description: 'Clear focus/Close modals',
      category: 'Navigation'
    },
    {
      key: 'h',
      action: () => {
        window.location.href = '/admin'
      },
      description: 'Go to dashboard',
      category: 'Navigation'
    },
    {
      key: 't',
      action: () => {
        window.location.href = '/admin/timetable'
      },
      description: 'Go to timetable',
      category: 'Navigation'
    },
    {
      key: 'p',
      action: () => {
        window.location.href = '/admin/programs'
      },
      description: 'Go to programs',
      category: 'Navigation'
    },
    {
      key: 'c',
      action: () => {
        window.location.href = '/admin/courses'
      },
      description: 'Go to courses',
      category: 'Navigation'
    },
    {
      key: 'f',
      action: () => {
        window.location.href = '/admin/faculty'
      },
      description: 'Go to faculty',
      category: 'Navigation'
    },
    {
      key: 'r',
      action: () => {
        window.location.href = '/admin/rooms'
      },
      description: 'Go to rooms',
      category: 'Navigation'
    },
  ]

  useKeyboardShortcuts(shortcuts)
  return shortcuts
}

// Timetable-specific shortcuts
export function useTimetableShortcuts({
  onGenerate,
  onClear,
  onToggleView,
  onExport,
}: {
  onGenerate?: () => void
  onClear?: () => void
  onToggleView?: () => void
  onExport?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'g',
      ctrlKey: true,
      action: () => onGenerate?.(),
      description: 'Generate timetable',
      category: 'Timetable'
    },
    {
      key: 'Delete',
      ctrlKey: true,
      action: () => onClear?.(),
      description: 'Clear timetable',
      category: 'Timetable'
    },
    {
      key: 'v',
      action: () => onToggleView?.(),
      description: 'Toggle view mode',
      category: 'Timetable'
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => onExport?.(),
      description: 'Export timetable',
      category: 'Timetable'
    },
  ]

  useKeyboardShortcuts(shortcuts)
  return shortcuts
}