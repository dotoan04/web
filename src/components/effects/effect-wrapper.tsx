'use client'

import { usePathname } from 'next/navigation'

import { SakuraPetals } from './sakura-petals'
import { Snowfall } from './snowfall'

type EffectWrapperProps = {
  effectType: 'none' | 'snow' | 'sakura'
}

export function EffectWrapper({ effectType }: EffectWrapperProps) {
  const pathname = usePathname()
  
  // Don't show effects on quiz pages
  const shouldShowEffect = !pathname.startsWith('/doquizz')
  
  if (!shouldShowEffect || effectType === 'none') {
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

