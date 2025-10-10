import { cn } from '@/components/ui/cn'
import type { ReactNode } from 'react'

const toneStyles: Record<string, string> = {
  info: 'border-ink-200 bg-ink-50/80 text-ink-700 dark:border-ink-600 dark:bg-ink-800/70 dark:text-ink-100',
  success: 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-600/70 dark:bg-emerald-950/40 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-100',
  danger: 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-600/70 dark:bg-rose-950/40 dark:text-rose-100',
}

type CalloutProps = {
  type?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  children: ReactNode
}

export const Callout = ({ type = 'info', title, children }: CalloutProps) => (
  <div className={cn('rounded-2xl border px-5 py-4 shadow-sm backdrop-blur-sm', toneStyles[type])}>
    {title ? <p className="text-sm font-semibold uppercase tracking-[0.3em]">{title}</p> : null}
    <div className={cn('mt-2 text-sm leading-relaxed', title ? '' : 'mt-0')}>{children}</div>
  </div>
)
