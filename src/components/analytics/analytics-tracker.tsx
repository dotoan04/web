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
    const controller = new AbortController()

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPath,
        referrer: document.referrer || undefined,
        source: params.get('utm_source') ?? undefined,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Không thể gửi sự kiện analytics:', error)
      }
    })

    return () => {
      controller.abort()
    }
  }, [pathname, search])

  return null
}
