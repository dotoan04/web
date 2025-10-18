"use client"

import { useEffect, useMemo, useState } from 'react'
import { Palette, Leaf, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/components/ui/cn'

const themeOptions = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Đêm', icon: Moon },
  { value: 'sunset', label: 'Hoàng hôn', icon: Palette },
  { value: 'countryside', label: 'Đồng quê', icon: Leaf },
]

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('[data-theme-toggle]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handler)
    }

    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [isOpen])

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  const activeTheme = useMemo(() => themeOptions.find((option) => option.value === currentTheme), [currentTheme])

  const handleSelect = (value: string) => {
    setTheme(value)
    setIsOpen(false)
  }

  const ActiveIcon = activeTheme?.icon ?? Sun

  return (
    <div className="relative" data-theme-toggle>
      <button
        type="button"
        aria-label="Chọn giao diện"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white/80 text-ink-600 shadow-sm transition hover:border-ink-400 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200 dark:hover:border-ink-500 dark:hover:text-ink-50"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {mounted ? <ActiveIcon size={16} /> : <Moon size={16} className="opacity-0" />}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-2xl border border-ink-100 bg-white/95 shadow-[0_20px_45px_rgba(31,38,135,0.2)] backdrop-blur-xl transition dark:border-ink-800 dark:bg-ink-900/95 dark:shadow-[0_20px_45px_rgba(8,10,28,0.5)]">
          <div className="flex flex-col">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = option.value === currentTheme
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 text-sm text-ink-600 transition hover:bg-white/70 dark:text-ink-200 dark:hover:bg-ink-800/70',
                    isActive && 'bg-white/70 font-semibold text-ink-800 dark:bg-ink-800/80 dark:text-ink-50'
                  )}
                >
                  <Icon size={16} />
                  {option.label}
                  {isActive ? (
                    <span className="ml-auto rounded-full bg-ink-500/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-ink-500 dark:bg-ink-500/30 dark:text-ink-200">
                      chọn
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
