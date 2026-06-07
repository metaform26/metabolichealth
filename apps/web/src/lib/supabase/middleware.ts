import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@health/supabase'

export async function updateSession(request: NextRequest) {
  // If Supabase isn't configured yet, pass all requests through unguarded.
  // This lets the app run and show the "not configured" banner on the login page.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh the session with a timeout so a slow/unavailable Supabase never
  // hangs the entire page load — fall through as unauthenticated on timeout.
  let user = null
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('supabase_timeout')), 3000),
      ),
    ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>
    user = result.data.user
  } catch {
    // Timeout or network error — treat as unauthenticated, let login page handle it
    return NextResponse.next({ request })
  }

  const { pathname } = request.nextUrl

  // Public paths that never require auth
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/_next' ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin-only guard
  if (pathname.startsWith('/admin') && user) {
    const adminEmails = getAdminEmails()
    if (!adminEmails.includes(user.email ?? '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

/** Returns the authorised admin email list.
 *  Seeds from ADMIN_EMAILS env var (comma-separated) and always includes
 *  the owner email as a fallback so the app works before env is set. */
export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS ?? ''
  const fromEnv = env.split(',').map((e) => e.trim()).filter(Boolean)
  const owners = ['dipanbaral05@gmail.com', 'mandal.kash@gmail.com', 'admin.metaform@gmail.com']
  return Array.from(new Set([...owners, ...fromEnv]))
}
