'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { SakuraPetals } from './sakura-petals'
import { Snowfall } from './snowfall'

type EffectWrapperProps = {
  effectType: 'none' | 'snow' | 'sakura'
}

export function EffectWrapper({ effectType }: EffectWrapperProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    update()

    const handler = () => update()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  
  // Don't show effects on quiz pages
  const shouldShowEffect = !pathname.startsWith('/doquizz')
  
  if (!shouldShowEffect || effectType === 'none' || isMobile) {
    return null
  }
  
  if (effectType === 'snow') {
    return <Snowfall density={1} />
  }
  
  if (effectType === 'sakura') {
    return <SakuraPetals />
  }
  
  return null
}

