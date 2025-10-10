import { forwardRef } from 'react'
import { cn } from '@/components/ui/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-800 shadow-sm transition focus-visible:border-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-300 placeholder:text-ink-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:placeholder:text-ink-500',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
