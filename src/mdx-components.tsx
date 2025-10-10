import type { AnchorHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import type { MDXComponents } from 'mdx/types'

import { PrefetchLink } from '@/components/ui/prefetch-link'

const Anchor = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(({ href, children, ...props }, _ref) => {
  if (!href) return <a {...props}>{children}</a>
  const isInternal = href.startsWith('/') && !href.startsWith('//')
  if (isInternal) {
    return (
      <PrefetchLink href={href} {...props}>
        {children}
      </PrefetchLink>
    )
  }

  return (
    <a href={href} target={props.target ?? '_blank'} rel={props.rel ?? 'noopener noreferrer'} {...props}>
      {children}
    </a>
  )
})

Anchor.displayName = 'MDXAnchor'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: Anchor,
    ...components,
  }
}
