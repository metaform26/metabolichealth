import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Whether the signed-in user is an admin, as decided by the database
 * (public.is_admin(), i.e. profiles.role = 'admin').
 *
 * Returns null while checking. This only controls what the UI shows; the real
 * protection is the RLS policies that call is_admin() on the server, so a user
 * who forces the UI open still can't read anything they aren't allowed to.
 */
export function useIsAdmin(): boolean | null {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { if (!cancelled) setIsAdmin(false); return }
      const { data, error } = await supabase.rpc('is_admin')
      if (!cancelled) setIsAdmin(!error && data === true)
    }
    check()
    // Re-check when the user signs in or out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') check()
    })
    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return isAdmin
}
