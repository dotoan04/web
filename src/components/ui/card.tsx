import { cn } from '@/components/ui/cn'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-3xl border border-ink-100 bg-white/80 p-6 shadow-[0_10px_40px_rgba(27,20,14,0.08)] backdrop-blur-lg dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_10px_40px_rgba(0,0,0,0.45)]',
      className,
    )}
    {...props}
  />
)

export const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />
)

export const CardTitle = ({ className, ...props }: CardProps) => (
  <h3 className={cn('font-display text-xl font-semibold text-ink-900 dark:text-ink-100', className)} {...props} />
)

export const CardDescription = ({ className, ...props }: CardProps) => (
  <p className={cn('text-sm text-ink-500 dark:text-ink-300', className)} {...props} />
)

export const CardContent = ({ className, ...props }: CardProps) => (
  <div className={cn('flex flex-col gap-4', className)} {...props} />
)
