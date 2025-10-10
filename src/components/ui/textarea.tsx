import { forwardRef } from 'react'
import { cn } from '@/components/ui/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 shadow-sm transition focus-visible:border-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-300 placeholder:text-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:placeholder:text-ink-500',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
