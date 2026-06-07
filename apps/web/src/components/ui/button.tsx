import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // variants
            'bg-teal-700 text-white hover:bg-teal-800 active:scale-[0.98] shadow-sm':
              variant === 'primary',
            'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-[0.98]':
              variant === 'secondary',
            'text-slate-600 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
            'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100': variant === 'danger',
            'border border-teal-200 text-teal-700 hover:bg-teal-50': variant === 'outline',
            // sizes
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
