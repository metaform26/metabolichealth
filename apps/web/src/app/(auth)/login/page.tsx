'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, CheckCircle, Activity } from 'lucide-react'
// Supabase client is imported dynamically inside handleSubmit so Turbopack
// doesn't bundle @supabase/ssr eagerly — prevents first-load compilation hang.
type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/client').createClient>>

type Mode = 'signin' | 'signup' | 'forgot'

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'auth_callback_failed') setError('Authentication failed. Please try again.')
    if (err === 'not_admin') setError('You do not have admin access.')
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!SUPABASE_CONFIGURED) {
      setError('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.')
      return
    }

    setLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase: SupabaseClient = createClient()

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        })
        if (error) throw error
        setSuccess('Password reset link sent — check your email.')
        setLoading(false)
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
        setLoading(false)
        return
      }

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  const titles: Record<Mode, { heading: string; sub: string; cta: string }> = {
    signin: { heading: 'Welcome back', sub: 'Sign in to your metabolic health account', cta: 'Sign in' },
    signup: { heading: 'Create account', sub: 'Start your metabolic health journey', cta: 'Create account' },
    forgot: { heading: 'Reset password', sub: 'We\'ll send a reset link to your email', cta: 'Send reset link' },
  }

  const { heading, sub, cta } = titles[mode]

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center mb-3 shadow-lg shadow-teal-200">
          <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
        <p className="text-sm text-slate-500 mt-1">{sub}</p>
      </div>

      {/* Supabase not configured banner */}
      {!SUPABASE_CONFIGURED && (
        <div className="mb-4 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold mb-1">Supabase not configured</p>
            <p>Create <code className="bg-amber-100 px-1 rounded">apps/web/.env.local</code> with your Supabase URL and anon key to enable authentication.</p>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 p-8">

        {/* Mode tabs */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ava Morgan"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null) }}
                    className="text-xs text-teal-700 hover:text-teal-900 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Consent note (signup) */}
          {mode === 'signup' && (
            <p className="text-xs text-slate-400 leading-relaxed">
              By creating an account you agree to our{' '}
              <span className="text-teal-700 font-medium cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-teal-700 font-medium cursor-pointer hover:underline">Privacy Policy</span>.
              Your health data is encrypted and HIPAA-eligible.
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-700">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 text-white font-semibold py-3 rounded-xl hover:bg-teal-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-md shadow-teal-100 mt-1"
          >
            {loading ? 'Please wait…' : cta}
          </button>

          {/* Back to sign in (forgot mode) */}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setSuccess(null) }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium py-2"
            >
              ← Back to sign in
            </button>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-6">
        🔒 HIPAA-eligible · Encrypted storage · No data selling
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg shadow-teal-200">
          <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
