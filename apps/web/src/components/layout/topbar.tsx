import { Bell, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

interface TopbarProps {
  title: string
  eyebrow?: string
  actions?: React.ReactNode
}

export function Topbar({ title, eyebrow, actions }: TopbarProps) {
  const [initials, setInitials] = useState('U')
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? ''
      const name = (data.user?.user_metadata?.full_name as string) ?? email
      setInitials(
        name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || email[0]?.toUpperCase() || 'U',
      )
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-40">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-0.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold text-slate-900 leading-none">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-xl">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-xl">
          <Settings className="w-4 h-4" />
        </Button>

        {/* Avatar + sign-out dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-xs font-bold hover:bg-teal-800 transition-colors"
          >
            {initials}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white border border-slate-100 rounded-2xl shadow-lg shadow-slate-100 py-1 min-w-[140px] z-50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
