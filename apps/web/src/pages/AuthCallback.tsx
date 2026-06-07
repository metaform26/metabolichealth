import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          navigate('/login?error=auth_callback_failed', { replace: true })
        } else {
          navigate(next, { replace: true })
        }
      })
    } else {
      navigate('/login?error=auth_callback_failed', { replace: true })
    }
  }, [navigate, searchParams])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
