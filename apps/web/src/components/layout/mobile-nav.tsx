import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  TrendingUp,
  Watch,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Goals', icon: LayoutDashboard },
  { href: '/tracking', label: 'Track', icon: UtensilsCrossed },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/devices', label: 'Devices', icon: Watch },
  { href: '/explore', label: 'Explore', icon: Compass },
]

export function MobileNav() {
  const { pathname } = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[56px] transition-all',
                active ? 'text-teal-700' : 'text-slate-400'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'text-teal-600')} />
              <span className={cn('text-[10px] font-semibold', active ? 'text-teal-700' : 'text-slate-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
