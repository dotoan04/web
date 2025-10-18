'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

type ParallaxCharacterProps = {
  imageUrl: string
}

export function ParallaxCharacter({ imageUrl }: ParallaxCharacterProps) {
  const [offsetY, setOffsetY] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    
    const updateViewport = () => {
      setIsDesktop(mediaQuery.matches)
    }
    
    updateViewport()
    
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateViewport, 150)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!isDesktop) return

    let rafId: number
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        setOffsetY(window.pageYOffset)
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isDesktop])

  const parallaxStyles = useMemo(() => ({
    transform: `translateY(${offsetY * 0.35}px)`,
    willChange: 'transform',
  }), [offsetY])

  // Don't render anything on mobile/tablet
  if (!isDesktop) {
    return null
  }

  return (
    <div 
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={parallaxStyles}
    >
      <div className="absolute bottom-0 right-0 h-full w-auto opacity-30 dark:opacity-20">
        <Image
          src={imageUrl}
          alt="Parallax character"
          width={600}
          height={800}
          className="h-full w-auto object-contain object-bottom"
          priority
          draggable={false}
        />
      </div>
    </div>
  )
}

