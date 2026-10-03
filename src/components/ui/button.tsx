import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }

export function Button({ variant = 'default', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground hover:opacity-90',
        variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    />
  )
}
