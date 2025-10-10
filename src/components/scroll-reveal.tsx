'use client'

import { motion, useInView } from 'framer-motion'
import { ReactNode, useRef } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  delay?: number
  className?: string
}

export const ScrollReveal = ({ children, delay = 0, className }: ScrollRevealProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const FadeIn = ({ children, delay = 0, className }: ScrollRevealProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const SlideIn = ({ 
  children, 
  delay = 0, 
  direction = 'left',
  className 
}: ScrollRevealProps & { direction?: 'left' | 'right' | 'up' | 'down' }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const variants = {
    left: { x: -30, opacity: 0 },
    right: { x: 30, opacity: 0 },
    up: { y: -30, opacity: 0 },
    down: { y: 30, opacity: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={variants[direction]}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : variants[direction]}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

