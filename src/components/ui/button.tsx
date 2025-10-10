import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/components/ui/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-ink-700 text-ink-50 hover:bg-ink-800 focus-visible:outline-ink-600 dark:bg-ink-600 dark:hover:bg-ink-500',
        ghost:
          'bg-transparent text-ink-700 hover:bg-ink-100 focus-visible:outline-ink-300 dark:text-ink-200 dark:hover:bg-ink-700/70',
        subtle:
          'bg-ink-100 text-ink-800 hover:bg-ink-200 focus-visible:outline-ink-400 dark:bg-ink-700/60 dark:text-ink-100 dark:hover:bg-ink-600/60',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
