'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/components/ui/cn'

type ParallaxCharacterProps = {
  imageUrl: string
}

export function ParallaxCharacter({ imageUrl }: ParallaxCharacterProps) {
  const [offsetY, setOffsetY] = useState(0)
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

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

  useEffect(() => {
    if (viewport !== 'desktop') {
      setOffsetY(0)
      return
    }

    const handleScroll = () => {
      setOffsetY(window.pageYOffset)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [viewport])

  const parallaxStyles = useMemo(() => ({
    transform: `translateY(${offsetY * 0.35}px)`,
    transition: 'transform 0.12s ease-out',
  }), [offsetY])

  if (viewport !== 'desktop') {
    const baseClass =
      'aspect-[3/4] max-w-[45vw] rounded-[1.75rem] border border-white/25 bg-gradient-to-b from-white/70 to-white/20 opacity-60 shadow-[0_15px_35px_rgba(31,38,135,0.22)] backdrop-blur-2xl dark:border-white/10 dark:from-white/15 dark:to-white/5 dark:opacity-40 dark:shadow-[0_15px_35px_rgba(31,38,135,0.32)]'
    return (
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end">
        <div
          className={cn(
            baseClass,
            viewport === 'tablet'
              ? 'w-36 max-w-[38vw] translate-y-6 rounded-[2rem]'
              : 'w-32 translate-y-4 sm:w-40'
          )}
        />
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

