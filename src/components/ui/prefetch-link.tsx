"use client"

import Link, { type LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'

type PrefetchLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    className?: string
    children: ReactNode
  prefetchOnHover?: boolean
  prefetchOnViewport?: boolean
  }

const toHrefString = (href: LinkProps['href']) => {
  if (typeof href === 'string') return href
  const url = href.pathname ?? ''
  const search = href.query ? `?${new URLSearchParams(href.query as Record<string, string>).toString()}` : ''
  const hash = href.hash ? `#${href.hash}` : ''
  return `${url}${search}${hash}`
}

export const PrefetchLink = ({
  prefetchOnHover = true,
  prefetchOnViewport = true,
  onMouseEnter,
  onFocus,
  children,
  ...props
}: PrefetchLinkProps) => {
  const router = useRouter()
  const prefetched = useRef(false)
  const hrefString = useMemo(() => toHrefString(props.href), [props.href])
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => () => observerRef.current?.disconnect(), [])

  const prefetch = useCallback(() => {
    if (prefetched.current) return
    prefetched.current = true
    void router.prefetch(hrefString)
  }, [router, hrefString])

  const setRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!prefetchOnViewport || !node || prefetched.current) return
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch()
            observerRef.current?.disconnect()
            observerRef.current = null
          }
        })
      })
      observerRef.current.observe(node)
    },
    [prefetchOnViewport, prefetch]
  )

  return (
    <Link
      {...props}
      prefetch={false}
      ref={setRef}
      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        if (prefetchOnHover) prefetch()
      }}
      onFocus={(event) => {
        onFocus?.(event)
        if (prefetchOnHover) prefetch()
      }}
    >
      {children}
    </Link>
  )
}
