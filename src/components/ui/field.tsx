import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const base =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(base, className)} {...p} />
)
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(base, className)} {...p} />
)
export const Field = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <label className={cn('block space-y-1.5', className)}>
    <span className="text-sm font-medium">{label}</span>
    {children}
  </label>
)
