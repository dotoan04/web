"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface FadeInProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  threshold?: number
  once?: boolean
}

export const FadeIn = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  threshold = 0.1,
  once = true,
}: FadeInProps) => {
  const [hasAnimated, setHasAnimated] = useState(false)
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
  })

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true)
    }
  }, [inView, hasAnimated])

  const getDirectionStyles = () => {
    const shouldAnimate = once ? hasAnimated : inView
    
    const baseStyles = {
      opacity: shouldAnimate ? 1 : 0,
      transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    }

    const transforms: Record<typeof direction, string> = {
      up: shouldAnimate ? 'translateY(0)' : 'translateY(30px)',
      down: shouldAnimate ? 'translateY(0)' : 'translateY(-30px)',
      left: shouldAnimate ? 'translateX(0)' : 'translateX(30px)',
      right: shouldAnimate ? 'translateX(0)' : 'translateX(-30px)',
      none: 'translateY(0)',
    }

    return {
      ...baseStyles,
      transform: transforms[direction],
    }
  }

  return (
    <div ref={ref} style={getDirectionStyles()} className={className}>
      {children}
    </div>
  )
}

