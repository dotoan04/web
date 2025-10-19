"use client"

import { useState, useEffect } from 'react'
import { X, Palette } from 'lucide-react'

const STORAGE_KEY = 'theme-feature-acknowledged'

export const ThemeFeatureNotification = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already acknowledged the theme feature
    const hasAcknowledged = localStorage.getItem(STORAGE_KEY)
    
    if (!hasAcknowledged) {
      // Show notification after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)

      // Auto-dismiss after 5 seconds
      const autoDismiss = setTimeout(() => {
        setIsVisible(false)
      }, 6000)

      return () => {
        clearTimeout(timer)
        clearTimeout(autoDismiss)
      }
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-white/95 p-4 pr-3 shadow-lg backdrop-blur-sm dark:border-indigo-800 dark:bg-slate-900/95 max-w-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <Palette size={18} />
        </div>
        
        <div className="flex-1 text-sm">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Giao diện mới đã có! 🎨
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Thử các chủ đề Hoàng hôn & Đồng quê bằng nút ở góc trên.
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Đóng thông báo"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// Helper function to mark theme feature as acknowledged
export const markThemeFeatureAcknowledged = () => {
  localStorage.setItem(STORAGE_KEY, 'true')
}
