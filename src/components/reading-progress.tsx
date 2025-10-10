"use client"

import { useEffect, useState } from 'react'

export const ReadingProgress = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      if (scrollHeight <= 0) {
        setProgress(0)
        return
      }
      setProgress(Math.min(100, Math.max(0, (scrolled / scrollHeight) * 100)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[999] h-1 bg-transparent">
      <div
        aria-hidden="true"
        className="h-full origin-left scale-x-0 rounded-r-full bg-ink-700 transition-transform duration-200 ease-out dark:bg-ink-400"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  )
}
