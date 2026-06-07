import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UtensilsCrossed,
  TrendingUp,
  Watch,
  Compass,
  ShieldCheck,
  LogOut,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = ['dipanbaral05@gmail.com', 'mandal.kash@gmail.com', 'admin.metaform@gmail.com']

const navItems = [
  { href: '/dashboard', label: 'Goals', icon: LayoutDashboard },
  { href: '/tracking', label: 'Daily Tracking', icon: UtensilsCrossed },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/devices', label: 'Devices', icon: Watch },
  { href: '/explore', label: 'Explore', icon: Compass },
]

const adminItems = [
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(ADMIN_EMAILS.includes(session?.user?.email ?? ''))
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-100 px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 leading-none">Metabolic</p>
          <p className="text-sm font-bold text-slate-800 leading-none mt-0.5">Health</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-teal-600' : 'text-slate-400')} />
              {label}
            </Link>
          )
        })}

        {isAdmin && <div className="pt-4 mt-4 border-t border-slate-100">
          {adminItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon className={cn('w-4 h-4', active ? 'text-teal-600' : 'text-slate-400')} />
                {label}
              </Link>
            )
          })}
        </div>}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 pt-4">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all w-full">
          <LogOut className="w-4 h-4 text-slate-400" />
          Log out
        </button>
      </div>
    </aside>
  )
}
