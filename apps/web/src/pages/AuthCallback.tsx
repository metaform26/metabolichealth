import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/dashboard'
    const code = searchParams.get('code')
    const errorDescription = searchParams.get('error_description') || searchParams.get('error')

    if (errorDescription) {
      navigate('/login?error=auth_callback_failed', { replace: true })
      return
    }

    // The Supabase client is created with the default `detectSessionInUrl: true`,
    // so it already parses the `code` (PKCE) or `access_token`/`refresh_token`
    // (implicit) from this URL and saves the session during client
    // initialization — getSession() awaits that initialization internally.
    //
    // Don't call exchangeCodeForSession() here: the `code` is single-use, and
    // the client above has already exchanged it. A second exchange fails
    // (code verifier already consumed) even though the session was set up
    // correctly, which previously sent confirmed users to /login with a
    // bogus "Authentication failed" error.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session && !error) {
        navigate(next, { replace: true })
      } else if (code) {
        // A `code` is present but no session was created — this happens when
        // the confirmation link is opened in a different browser/device than
        // the one used to sign up, since the PKCE code verifier only exists
        // in that original browser. Supabase already confirmed the email
        // server-side before redirecting here, so send the user to sign in
        // normally instead of showing a hard error.
        navigate('/login?confirmed=1', { replace: true })
      } else {
        navigate('/login?error=auth_callback_failed', { replace: true })
      }
    })
  }, [navigate, searchParams])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
