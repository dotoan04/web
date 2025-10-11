"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ListTree, X } from "lucide-react"

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

const DESKTOP_TOP_OFFSET = "7.5rem"

export const TableOfContents = ({ headings, className }: TableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const firstInteractiveItemRef = useRef<HTMLAnchorElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

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

  useEffect(() => {
    if (!drawerOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null

    const timeout = window.setTimeout(() => {
      firstInteractiveItemRef.current?.focus()
    }, 0)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.clearTimeout(timeout)
      document.body.style.overflow = previousOverflow
      previouslyFocusedElement.current?.focus?.()
    }
  }, [drawerOpen])

  if (items.length === 0) return null

  const handleItemClick = (headingId: string, onComplete?: () => void) => {
    setActiveId(headingId)
    onComplete?.()
  }

  const renderItems = (options?: { onItemClick?: () => void; focusFirst?: boolean }) => (
    <ul className="space-y-2">
      {items.map((heading, index) => (
        <li key={heading.id} className="leading-snug">
          <a
            ref={options?.focusFirst && index === 0 ? firstInteractiveItemRef : undefined}
            href={`#${heading.id}`}
            onClick={() => handleItemClick(heading.id, options?.onItemClick)}
            className={cn(
              "relative block rounded-xl px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 focus-visible:ring-offset-2 dark:focus-visible:ring-ink-500",
              "hover:bg-ink-100/70 hover:text-ink-900 dark:hover:bg-ink-700/70 dark:hover:text-ink-50",
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

  const desktopMotionProps = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }

  return (
    <div className={cn("relative", className)}>
      <motion.nav
        aria-label="Mục lục bài viết"
        className="sticky hidden xl:block"
        style={{ top: DESKTOP_TOP_OFFSET, maxHeight: `calc(100vh - ${DESKTOP_TOP_OFFSET} - 2rem)` }}
        {...desktopMotionProps}
      >
        <div className="flex max-h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white/80 p-5 text-sm shadow-[0_12px_30px_rgba(33,38,94,0.12)] backdrop-blur-md dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">Mục lục</p>
          <div className="-mr-3 flex-1 overflow-y-auto pr-3" aria-label="Danh sách mục trong bài">
            {renderItems()}
          </div>
        </div>
      </motion.nav>

      <div className="xl:hidden">
        <motion.button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-6 right-5 z-[90] flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(33,38,94,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_55px_rgba(33,38,94,0.32)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 focus-visible:ring-offset-2 dark:bg-ink-100 dark:text-ink-900 dark:hover:shadow-[0_22px_55px_rgba(9,11,38,0.55)]"
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          whileHover={shouldReduceMotion ? undefined : { translateY: -4 }}
        >
          <ListTree className="h-4 w-4" aria-hidden="true" />
          <span>Mục lục</span>
        </motion.button>

        <AnimatePresence>
          {drawerOpen ? (
            <>
              <motion.div
                className="fixed inset-0 z-[95] bg-ink-900/45 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.25 } }}
                exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0 : 0.2 } }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Mục lục bài viết"
                className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[22rem] flex-col rounded-l-[2rem] border border-ink-100 bg-white/95 p-6 shadow-[0_22px_60px_rgba(33,38,94,0.35)] dark:border-ink-700 dark:bg-ink-900/90 dark:text-ink-100"
                initial={{ x: shouldReduceMotion ? 0 : "100%" }}
                animate={{ x: 0, transition: shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 26 } }}
                exit={{ x: shouldReduceMotion ? 0 : "100%", transition: { duration: shouldReduceMotion ? 0 : 0.25, ease: "easeIn" } }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">Mục lục</p>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100/60 text-ink-500 transition hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 focus-visible:ring-offset-2 dark:border-ink-700 dark:text-ink-300 dark:hover:text-ink-50"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Đóng mục lục</span>
                  </button>
                </div>
                <div className="mt-4 flex-1 overflow-y-auto pr-1">
                  {renderItems({ onItemClick: () => setDrawerOpen(false), focusFirst: true })}
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

const TableOfContentsDefault = TableOfContents

export default TableOfContentsDefault
