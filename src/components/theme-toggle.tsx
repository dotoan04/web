"use client"

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <button
      type="button"
      aria-label="Chuyển đổi giao diện"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white/80 text-ink-600 shadow-sm transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200 dark:hover:border-ink-500 dark:hover:text-ink-50"
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
    >
      {mounted && currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      {!mounted && <Moon size={16} className="opacity-0" />}
    </button>
  )
}
