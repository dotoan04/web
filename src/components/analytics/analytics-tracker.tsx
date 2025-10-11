'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export const AnalyticsTracker = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return
    }

    const currentPath = search ? `${pathname}?${search}` : pathname
    if (lastTracked.current === currentPath) {
      return
    }

    lastTracked.current = currentPath

    const params = new URLSearchParams(search)

    // Use keepalive to ensure tracking completes even if page navigates away
    // Don't use AbortController to avoid fetch failed errors
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPath,
        referrer: document.referrer || undefined,
        source: params.get('utm_source') ?? undefined,
      }),
      keepalive: true,
    }).catch((error) => {
      // Silently fail in production to avoid console noise
      // Analytics should not break user experience
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics tracking failed:', error)
      }
    })
  }, [pathname, search])

  return null
}
