'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type AnimatedHeroProps = {
  children: ReactNode
}

export const AnimatedHero = ({ children }: AnimatedHeroProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}

export const FloatingCircle = () => {
  return (
    <div className="relative h-40 w-40 overflow-hidden rounded-full bg-gradient-to-br from-ink-300/70 via-ink-200/40 to-ink-100/60 shadow-[0_20px_50px_rgba(33,38,94,0.2)] dark:from-ink-700/50 dark:via-ink-700/30 dark:to-ink-800/50 dark:shadow-[0_20px_50px_rgba(9,11,38,0.45)] sm:h-52 sm:w-52">
      {/* Animated pulse rings */}
      <motion.div
        className="absolute inset-2 rounded-full border border-white/60 dark:border-ink-600/60"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-6 rounded-full border border-white/30 dark:border-ink-600/40"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute inset-10 rounded-full border border-white/20 dark:border-ink-600/30"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      
      {/* Rotating gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Floating particles */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-2 w-2 rounded-full bg-white/40 dark:bg-white/20"
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/3 h-1.5 w-1.5 rounded-full bg-white/30 dark:bg-white/15"
        animate={{
          y: [10, -10, 10],
          x: [5, -5, 5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  )
}

