'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

type ParallaxCharacterProps = {
  imageUrl: string
}

export function ParallaxCharacter({ imageUrl }: ParallaxCharacterProps) {
  const [offsetY, setOffsetY] = useState(0)
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const update = () => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        setViewport('mobile')
        return
      }

      if (window.matchMedia('(max-width: 1023px)').matches) {
        setViewport('tablet')
        return
      }

      setViewport('desktop')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const parallaxStyles = useMemo(() => ({
    transform: `translateY(${offsetY * 0.35}px)`,
    transition: 'transform 0.12s ease-out',
  }), [offsetY])

  if (viewport === 'mobile') {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end">
        <div className="aspect-[3/4] w-32 max-w-[45vw] translate-y-4 rounded-[1.75rem] border border-white/25 bg-gradient-to-b from-white/70 to-white/20 opacity-60 shadow-[0_15px_35px_rgba(31,38,135,0.22)] backdrop-blur-2xl dark:border-white/10 dark:from-white/15 dark:to-white/5 dark:opacity-40 dark:shadow-[0_15px_35px_rgba(31,38,135,0.32)] sm:w-40" />
      </div>
    )
  }

  if (viewport === 'tablet') {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end">
        <div className="aspect-[3/4] w-36 max-w-[40vw] translate-y-6 rounded-[2rem] border border-white/20 bg-gradient-to-b from-white/70 to-white/20 opacity-50 shadow-[0_18px_40px_rgba(31,38,135,0.24)] backdrop-blur-2xl dark:border-white/10 dark:from-white/15 dark:to-white/5 dark:opacity-40 dark:shadow-[0_18px_40px_rgba(31,38,135,0.32)]" />
      </div>
    )
  }

  return (
    <div 
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
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

