"use client"

import { useEffect, useState, useRef, useMemo } from 'react'
import { useTheme } from 'next-themes'

interface ThemeTransition {
  fromTheme: string
  toTheme: string
  isActive: boolean
  progress: number
}

// Optimized easing function
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const ThemeTransition = () => {
  const { theme } = useTheme()
  const [transition, setTransition] = useState<ThemeTransition>({
    fromTheme: 'light',
    toTheme: 'light',
    isActive: false,
    progress: 0,
  })
  const [mounted, setMounted] = useState(false)
  const previousThemeRef = useRef<string | undefined>(undefined)

  // Mark as mounted after first render
  useEffect(() => {
    setMounted(true)
    previousThemeRef.current = theme
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!theme || !mounted) return
    
    // Only trigger transition if theme actually changed (not on mount or navigation)
    if (previousThemeRef.current && previousThemeRef.current !== theme) {
      setTransition((prev) => ({
        ...prev,
        toTheme: theme,
        isActive: true,
        progress: 0,
        fromTheme: prev.toTheme,
      }))

      // Optimized animation using requestAnimationFrame
      const duration = 600 // Reduced to 600ms for snappier feel
      const startTime = performance.now()
      let rafId: number

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const linearProgress = Math.min(elapsed / duration, 1)
        const easedProgress = easeInOutCubic(linearProgress)

        setTransition((prev) => ({
          ...prev,
          progress: easedProgress,
        }))

        if (linearProgress < 1) {
          rafId = requestAnimationFrame(animate)
        } else {
          setTimeout(() => {
            setTransition((prev) => ({
              ...prev,
              isActive: false,
              progress: 0,
            }))
          }, 150)
        }
      }

      rafId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(rafId)
    }
    
    // Update previous theme ref
    previousThemeRef.current = theme
  }, [theme, mounted])

  if (!transition.isActive) return null

  const getThemeColors = (themeName: string) => {
    const themeColorMap = {
      light: {
        primary: '#8b5cf6',
        secondary: '#c084fc',
        accent: '#d8b4fe',
        glow: '#e9d5ff',
      },
      dark: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#1e3a8a',
        glow: '#60a5fa',
      },
      sunset: {
        primary: '#ff6b35', // Vibrant orange-red
        secondary: '#f7931e', // Golden orange
        accent: '#fbbf24', // Warm yellow
        glow: '#fb923c', // Soft orange glow
      },
      countryside: {
        primary: '#10b981', // Emerald green
        secondary: '#34d399', // Lighter green
        accent: '#6ee7b7', // Mint green
        glow: '#86efac', // Soft green glow
      },
    }
    return themeColorMap[themeName as keyof typeof themeColorMap] || themeColorMap.light
  }

  const colors = getThemeColors(transition.toTheme)
  const progress = transition.progress

  // Smooth wave effect using eased progress
  const waveScale = 1 + (0.1 * Math.sin(progress * Math.PI * 2))
  const waveOpacity = Math.max(0, Math.cos((progress - 0.3) * Math.PI * 1.5))

  // Optimized particles generation - reduced count for better performance
  const particles = useMemo(() => {
    const particleCount = transition.toTheme === 'sunset' ? 10 : transition.toTheme === 'countryside' ? 8 : 6
    const result = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 100 + (i % 3) * 60
      
      let x, y, size, color
      
      if (transition.toTheme === 'sunset') {
        x = 50 + (Math.cos(angle) * radius * progress)
        y = 50 + (Math.sin(angle) * radius * progress * 0.7)
        size = 5
        color = i % 2 === 0 ? colors.primary : colors.secondary
      } else if (transition.toTheme === 'countryside') {
        const drift = Math.sin(progress * Math.PI + i) * 15
        x = 15 + (i * 11) + drift
        y = 15 + ((i * 7) % 50) + (progress * 25)
        size = 4
        color = i % 2 === 0 ? colors.primary : colors.accent
      } else {
        x = 25 + (i * 12) + Math.sin(progress * Math.PI + i) * 8
        y = 35 + ((i * 6) % 35) + Math.cos(progress * Math.PI + i) * 8
        size = 3
        color = colors.primary
      }

      result.push({ id: i, x, y, size, color })
    }
    return result
  }, [transition.toTheme, progress, colors])

  const particleOpacity = Math.max(0, 1 - progress * 1.4)

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      style={{
        opacity: 1 - progress * 0.8,
        willChange: 'opacity',
      }}
    >
      {/* Simplified gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: transition.toTheme === 'sunset' 
            ? `radial-gradient(ellipse 100% 60% at 50% 45%, ${colors.primary}30, ${colors.secondary}15, transparent 65%)`
            : transition.toTheme === 'countryside'
            ? `radial-gradient(circle at 50% 35%, ${colors.primary}25, ${colors.accent}12, transparent 60%)`
            : `radial-gradient(circle at 50% 50%, ${colors.primary}22, transparent 65%)`,
          transform: `scale(${waveScale})`,
          opacity: waveOpacity * 0.8,
          willChange: 'transform, opacity',
        }}
      />

      {/* Simplified ripple - only 2 rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 0.6].map((scaleMultiplier, ringIdx) => (
          <div
            key={ringIdx}
            style={{
              position: 'absolute',
              width: `${250 + progress * 550 * scaleMultiplier}px`,
              height: `${250 + progress * 550 * scaleMultiplier}px`,
              borderRadius: '50%',
              border: `2px solid ${colors.primary}`,
              opacity: Math.max(0, (1 - progress) * (0.5 - ringIdx * 0.2)),
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Optimized particles */}
      {progress < 0.65 && (
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                opacity: particleOpacity,
                boxShadow: `0 0 8px ${particle.color}`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}


