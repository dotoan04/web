import { cn } from '@/components/ui/cn'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>

export const Badge = ({ className, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border border-ink-200 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-ink-600 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-200',
      className,
    )}
    {...props}
  />
)
