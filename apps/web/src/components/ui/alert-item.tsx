import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

export function AlertItem({ alert }: { alert: Alert }) {
  const icons = {
    high: AlertTriangle,
    medium: AlertCircle,
    info: Info,
  }
  const Icon = icons[alert.level]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm font-medium border',
        {
          'bg-red-50 text-red-700 border-red-200': alert.level === 'high',
          'bg-amber-50 text-amber-700 border-amber-200': alert.level === 'medium',
          'bg-blue-50 text-blue-700 border-blue-200': alert.level === 'info',
        }
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{alert.message}</span>
    </div>
  )
}
