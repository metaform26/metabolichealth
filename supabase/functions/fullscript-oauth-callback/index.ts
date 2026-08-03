// Exchanges a Fullscript OAuth authorization code for tokens and stores
// them server-side. The client never sees the client secret or the tokens.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const FULLSCRIPT_TOKEN_URL = 'https://api-us-snd.fullscript.io/api/oauth/token'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Identify the calling user from their Supabase session.
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tokenRes = await fetch(FULLSCRIPT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: Deno.env.get('FULLSCRIPT_CLIENT_ID'),
        client_secret: Deno.env.get('FULLSCRIPT_CLIENT_SECRET'),
        code,
        redirect_uri: Deno.env.get('FULLSCRIPT_REDIRECT_URI'),
      }),
    })

    if (!tokenRes.ok) {
      const detail = await tokenRes.text()
      return new Response(JSON.stringify({ error: 'Token exchange failed', detail }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { oauth } = await tokenRes.json()
    const expiresAt = new Date(Date.now() + oauth.expires_in * 1000).toISOString()

    // Service-role client bypasses RLS — this is the only writer to this table.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { error: upsertError } = await adminClient
      .from('fullscript_connections')
      .upsert({
        user_id: user.id,
        access_token: oauth.access_token,
        refresh_token: oauth.refresh_token,
        token_type: oauth.token_type,
        scope: oauth.scope,
        resource_owner_id: oauth.resource_owner?.id ?? null,
        resource_owner_type: oauth.resource_owner?.type ?? null,
        expires_at: expiresAt,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
