'use client'

import { useEffect, useMemo, useState } from 'react'
import { Palette } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/components/ui/cn'

const themeOptions = [
  { value: 'system', label: 'Tự động' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
  { value: 'theme-sakura', label: 'Sakura' },
  { value: 'theme-aurora', label: 'Cực quang' },
]

const themePreviewClass: Record<string, string> = {
  system: 'from-ink-200 via-white to-ink-100 dark:from-ink-800 dark:via-ink-900 dark:to-ink-800',
  light: 'from-ink-200 via-white to-ink-100',
  dark: 'from-ink-800 via-ink-900 to-ink-800',
  'theme-sakura': 'from-rose-200 via-rose-100 to-amber-50',
  'theme-aurora': 'from-emerald-200 via-sky-200 to-indigo-200',
}

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = useMemo(() => {
    if (!mounted) return 'system'
    return theme ?? 'system'
  }, [mounted, theme])

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-600 shadow-sm backdrop-blur-md transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-800/80 dark:text-ink-200 dark:hover:border-ink-500 dark:hover:text-ink-50">
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-700/80 dark:text-ink-200">
        <Palette size={16} />
        <span
          className={cn(
            'pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br opacity-80',
            themePreviewClass[activeTheme]
          )}
        />
      </span>
      <label className="sr-only" htmlFor="theme-select">
        Chọn giao diện hiển thị
      </label>
      <select
        id="theme-select"
        className="appearance-none bg-transparent text-sm font-semibold outline-none"
        value={activeTheme}
        onChange={(event) => setTheme(event.target.value)}
      >
        {themeOptions.map((option) => (
          <option className="text-ink-800" key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
