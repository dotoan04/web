"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

interface ThemeTransition {
  fromTheme: string
  toTheme: string
  isActive: boolean
  progress: number
}

// Spring-based easing for ultra-smooth feel
const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

// Smooth easing function (ease-in-out-cubic)
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Smooth ease-out for natural deceleration
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4)
}

export const ThemeTransition = () => {
  const { theme } = useTheme()
  const [transition, setTransition] = useState<ThemeTransition>({
    fromTheme: 'light',
    toTheme: 'light',
    isActive: false,
    progress: 0,
  })

  useEffect(() => {
    if (!theme) return

    const handleThemeChange = () => {
      setTransition((prev) => ({
        ...prev,
        toTheme: theme,
        isActive: true,
        progress: 0,
        fromTheme: prev.toTheme,
      }))

      // Enhanced animation timeline with smoother easing
      const duration = 750 // 750ms for more luxurious feel
      const steps = 75
      const stepDuration = duration / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        const linearProgress = currentStep / steps
        const easedProgress = easeInOutCubic(linearProgress)

        setTransition((prev) => ({
          ...prev,
          progress: easedProgress,
        }))

        if (currentStep >= steps) {
          clearInterval(interval)
          setTimeout(() => {
            setTransition((prev) => ({
              ...prev,
              isActive: false,
              progress: 0,
            }))
          }, 250)
        }
      }, stepDuration)

      return () => clearInterval(interval)
    }

    handleThemeChange()
  }, [theme])

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

  // Generate theme-specific particles with enhanced effects
  const generateParticles = () => {
    const particleCount = transition.toTheme === 'sunset' ? 24 : transition.toTheme === 'countryside' ? 20 : 12
    const particles = []
    const easedProgress = easeOutQuart(progress)

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 80 + Math.random() * 180
      const stagger = (i / particleCount) * 0.3
      const staggeredProgress = Math.max(0, Math.min(1, progress - stagger))
      
      let x, y, size, opacity, blur, color
      
      if (transition.toTheme === 'sunset') {
        // Sunset: Radiant sun rays with gradient colors
        const rayProgress = easeOutElastic(staggeredProgress)
        x = 50 + (Math.cos(angle) * radius * rayProgress)
        y = 50 + (Math.sin(angle) * radius * rayProgress * 0.8) // Slightly flatten for horizon effect
        size = 6 + Math.sin(progress * Math.PI) * 3
        opacity = Math.max(0, (1 - progress) * 0.8) * (0.8 + Math.random() * 0.4)
        blur = 6 + Math.random() * 4
        // Alternate between warm colors
        color = i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
      } else if (transition.toTheme === 'countryside') {
        // Countryside: Organic floating leaves/butterflies
        const drift = Math.sin(progress * Math.PI * 2 + i) * 20
        const flutter = Math.cos(progress * Math.PI * 3 + i * 0.5) * 15
        x = 10 + (i * 4.5) + drift
        y = 10 + ((i * 5) % 60) + flutter + (staggeredProgress * 30)
        size = 4 + Math.sin(progress * Math.PI + i) * 2
        opacity = Math.max(0, (1 - progress * 1.2) * 0.7) * (0.7 + Math.random() * 0.3)
        blur = 3 + Math.random() * 3
        // Mix of green shades
        color = i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent
      } else {
        // Default particles with smooth fade
        x = 20 + (i * 7) + Math.sin(progress * Math.PI + i) * 10
        y = 30 + ((i * 5) % 40) + Math.cos(progress * Math.PI + i) * 10
        size = 3
        opacity = Math.max(0, (0.6 - progress) * 0.7)
        blur = 4
        color = colors.primary
      }

      particles.push({
        id: i,
        x,
        y,
        size,
        opacity,
        blur,
        color,
      })
    }
    return particles
  }

  const particles = generateParticles()

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        style={{
          opacity: 1 - progress * 0.7,
          backdropFilter: `blur(${progress * 8}px)`,
          WebkitBackdropFilter: `blur(${progress * 8}px)`,
        }}
      >
        {/* Multi-layered gradient overlays with theme-specific styling */}
        <div
          className="absolute inset-0"
          style={{
            background: transition.toTheme === 'sunset' 
              ? `radial-gradient(ellipse 100% 60% at 50% 45%, ${colors.accent}30, ${colors.primary}20, ${colors.secondary}10, transparent 70%)`
              : transition.toTheme === 'countryside'
              ? `radial-gradient(circle at 50% 30%, ${colors.secondary}25, ${colors.primary}15, ${colors.accent}10, transparent 65%)`
              : `radial-gradient(circle at 50% 50%, ${colors.primary}20, ${colors.secondary}10, transparent 70%)`,
            transform: `scale(${waveScale})`,
            opacity: waveOpacity,
            transition: 'background 0.3s ease-out',
          }}
        />

        {/* Secondary gradient for depth and atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background: transition.toTheme === 'sunset'
              ? `linear-gradient(to bottom, ${colors.glow}20, ${colors.secondary}15 50%, transparent 80%)`
              : transition.toTheme === 'countryside'
              ? `linear-gradient(to top, ${colors.accent}20, ${colors.primary}15 40%, transparent 70%)`
              : `radial-gradient(ellipse 800px 600px at 50% 40%, ${colors.accent}15, transparent 60%)`,
            opacity: progress * 0.5,
          }}
        />

        {/* Tertiary gradient layer for richness */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${30 + progress * 40}% ${40 + progress * 20}%, ${colors.glow}15, transparent 50%)`,
            opacity: (1 - progress) * 0.3,
          }}
        />

        {/* Animated ripple circles - enhanced with multiple rings and theme colors */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 0.7, 0.4].map((scaleMultiplier, ringIdx) => (
            <div
              key={ringIdx}
              style={{
                position: 'absolute',
                width: `${220 + progress * 600 * scaleMultiplier}px`,
                height: `${220 + progress * 600 * scaleMultiplier}px`,
                borderRadius: '50%',
                border: `${3 - ringIdx}px solid ${ringIdx === 0 ? colors.primary : ringIdx === 1 ? colors.secondary : colors.accent}`,
                opacity: Math.max(0, (1 - progress) * (1 - scaleMultiplier * 0.4) * 0.6),
                transform: `scale(${1 + progress * 0.4 * (1 - scaleMultiplier)})`,
                boxShadow: `0 0 ${40 + progress * 60}px ${colors.glow}50, inset 0 0 ${20 + progress * 30}px ${colors.glow}30`,
                filter: `blur(${ringIdx * 0.5}px)`,
              }}
            />
          ))}
        </div>

        {/* Theme-specific particle effects with enhanced styling */}
        {progress < 0.7 && (
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
                  opacity: particle.opacity,
                  boxShadow: `0 0 ${particle.blur * 2}px ${particle.color}${Math.round(particle.opacity * 255).toString(16).padStart(2, '0')}, 0 0 ${particle.blur}px ${particle.color}`,
                  filter: `blur(${particle.blur * 0.5}px)`,
                  transform: `scale(${1 + (progress * 0.3)})`,
                  transition: 'all 0.1s ease-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Ambient light shimmer for sunset/countryside */}
        {(transition.toTheme === 'sunset' || transition.toTheme === 'countryside') && progress < 0.5 && (
          <div
            className="absolute inset-0"
            style={{
              background: transition.toTheme === 'sunset'
                ? `linear-gradient(135deg, ${colors.accent}10, transparent 30%, ${colors.primary}10 70%, transparent)`
                : `linear-gradient(45deg, transparent 20%, ${colors.glow}15 50%, transparent 80%)`,
              opacity: Math.sin(progress * Math.PI) * 0.4,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>

      {/* Enhanced background glow effect with smoother transition */}
      <div 
        className="theme-glow-enhanced fixed inset-0 pointer-events-none z-[9998]"
        style={{
          opacity: transition.isActive ? 0.5 : 0.25,
          background: `radial-gradient(circle at 50% 50%, ${colors.primary}25, ${colors.secondary}15, transparent 50%)`,
          filter: `blur(${transition.isActive ? 100 : 80}px)`,
          transform: `scale(${transition.isActive ? 1.1 : 1})`,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </>
  )
}


