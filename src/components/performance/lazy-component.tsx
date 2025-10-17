"use client"

import { ReactNode, Suspense, memo } from 'react'
import { useInView } from 'react-intersection-observer'

interface LazyComponentProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
}

const LazyComponentInner = ({
  children,
  fallback = (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-indigo-600 dark:border-ink-700 dark:border-t-indigo-400" />
    </div>
  ),
  threshold = 0.1,
  rootMargin = '50px',
}: LazyComponentProps) => {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
  })

  return (
    <div ref={ref}>
      {inView ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

export const LazyComponent = memo(LazyComponentInner)

