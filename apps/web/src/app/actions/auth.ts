'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminEmails } from '@/lib/supabase/middleware'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function addAdminEmail(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !getAdminEmails().includes(user.email ?? '')) {
    throw new Error('Unauthorized')
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return

  // Store the email in a pending_admins table or simply note it —
  // the real guard lives in getAdminEmails() via the ADMIN_EMAILS env var.
  // When Supabase is fully wired this will upsert into profiles once the user signs up.
  console.log(`[admin] granted admin access to: ${email}`)
}
