"use client"

import { useEffect, useMemo, useState } from 'react'

export type TocHeading = {
  id: string
  text: string
  level: number
}

type TableOfContentsProps = {
  headings: TocHeading[]
}

export const TableOfContents = ({ headings }: TableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  const items = useMemo(() => headings.filter((heading) => heading.level >= 2 && heading.level <= 4), [headings])

  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 1] },
    )

    items.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="Mục lục bài viết" className="relative">
      <div className="sticky top-32 hidden max-h-[70vh] overflow-y-auto rounded-3xl border border-ink-100 bg-white/70 p-5 text-sm shadow-[0_12px_30px_rgba(27,20,14,0.08)] dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200 lg:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">
          Mục lục
        </p>
        <ul className="space-y-2">
          {items.map((heading) => (
            <li key={heading.id} className="leading-snug">
              <a
                href={`#${heading.id}`}
                className={`block rounded-xl px-3 py-2 transition hover:bg-ink-100/70 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-50 ${
                  activeId === heading.id
                    ? 'bg-ink-100/70 font-medium text-ink-900 dark:bg-ink-700/60 dark:text-ink-100'
                    : 'text-ink-500 dark:text-ink-300'
                }`}
                style={{ paddingLeft: `${(heading.level - 2) * 16 + 12}px` }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <details className="lg:hidden">
        <summary className="flex cursor-pointer items-center justify-between rounded-2xl border border-ink-200 bg-white/70 px-4 py-3 text-sm font-medium text-ink-700 shadow-sm dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
          Mục lục
        </summary>
        <ul className="mt-3 space-y-2 rounded-2xl border border-ink-100 bg-white/70 p-4 text-sm dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
          {items.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className="block rounded-xl px-3 py-2 text-ink-600 transition hover:bg-ink-100/70 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-700/70 dark:hover:text-ink-50"
                style={{ paddingLeft: `${(heading.level - 2) * 14 + 12}px` }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  )
}

const TableOfContentsDefault = TableOfContents

export default TableOfContentsDefault
