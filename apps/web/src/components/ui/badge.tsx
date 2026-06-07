import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'teal' | 'green' | 'amber' | 'red' | 'slate'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        {
          'bg-slate-100 text-slate-600': variant === 'default',
          'bg-teal-50 text-teal-700 border border-teal-100': variant === 'teal',
          'bg-green-50 text-green-700 border border-green-100': variant === 'green',
          'bg-amber-50 text-amber-700 border border-amber-100': variant === 'amber',
          'bg-red-50 text-red-700 border border-red-100': variant === 'red',
          'bg-slate-50 text-slate-500 border border-slate-100': variant === 'slate',
        },
        className
      )}
      {...props}
    />
  )
}
