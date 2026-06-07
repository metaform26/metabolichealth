import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, sub, accent, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 flex flex-col justify-between min-h-[120px]',
        accent
          ? 'bg-teal-700 border-teal-700 text-white'
          : 'bg-white border-slate-100 text-slate-900',
        className
      )}
    >
      <p className={cn('text-xs font-semibold uppercase tracking-wide', accent ? 'text-teal-200' : 'text-slate-500')}>
        {label}
      </p>
      <div>
        <p className={cn('text-3xl font-bold leading-none mt-2', accent ? 'text-white' : 'text-slate-900')}>
          {value}
        </p>
        {sub && (
          <p className={cn('text-xs mt-1.5 font-medium', accent ? 'text-teal-200' : 'text-slate-400')}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
