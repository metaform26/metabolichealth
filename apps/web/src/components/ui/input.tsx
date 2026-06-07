import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  suffix?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, suffix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="grid gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-300 focus:ring-red-400',
              suffix && 'pr-12',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3.5 text-xs font-semibold text-slate-400">{suffix}</span>
          )}
        </div>
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
