"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/components/ui/cn"

export type TocHeading = {
  id: string
  text: string
  level: number
}

type TableOfContentsProps = {
  headings: TocHeading[]
  className?: string
}

const DESKTOP_TOP_OFFSET = "5rem"

export const TableOfContents = ({ headings, className }: TableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  const items = useMemo(() => headings.filter((heading) => heading.level >= 2 && heading.level <= 4), [headings])

  useEffect(() => {
    setActiveId(headings[0]?.id ?? null)
  }, [headings])

  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 1] },
    )

    items.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  const renderItems = () => (
    <ul className="space-y-2">
      {items.map((heading) => (
        <li key={heading.id} className="leading-snug">
          <a
            href={`#${heading.id}`}
            className={cn(
              "block rounded-xl px-3 py-2 text-sm transition hover:bg-ink-100/70 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-50",
              activeId === heading.id
                ? "bg-ink-100/80 font-medium text-ink-900 shadow-sm dark:bg-ink-700/60 dark:text-ink-50"
                : "text-ink-500 dark:text-ink-300",
            )}
            style={{ paddingLeft: `${(heading.level - 2) * 16 + 12}px` }}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={cn("relative", className)}>
      <nav
        aria-label="Mục lục bài viết"
        className="sticky hidden xl:block"
        style={{ top: DESKTOP_TOP_OFFSET, maxHeight: `calc(100vh - ${DESKTOP_TOP_OFFSET} - 2rem)` }}
      >
        <div className="flex max-h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white/80 p-5 text-sm shadow-[0_12px_30px_rgba(33,38,94,0.12)] dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">Mục lục</p>
          <div className="-mr-3 flex-1 overflow-y-auto pr-3">{renderItems()}</div>
        </div>
      </nav>

      <details className="xl:hidden">
        <summary className="flex cursor-pointer items-center justify-between rounded-2xl border border-ink-200 bg-white/70 px-4 py-3 text-sm font-medium text-ink-700 shadow-sm dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
          Mục lục
        </summary>
        <div className="mt-3 rounded-2xl border border-ink-100 bg-white/70 p-4 text-sm dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
          {renderItems()}
        </div>
      </details>
    </div>
  )
}

const TableOfContentsDefault = TableOfContents

export default TableOfContentsDefault
