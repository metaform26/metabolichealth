-- ─────────────────────────────────────────────────────────────────────────────
-- Fullscript OAuth connection storage
-- ─────────────────────────────────────────────────────────────────────────────

-- Tokens live here. RLS is enabled with NO policies for anon/authenticated,
-- so this table is only reachable via the service-role key (i.e. from our
-- edge functions), never directly from the browser.
create table public.fullscript_connections (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null unique,
  access_token          text not null,
  refresh_token         text not null,
  token_type            text not null default 'Bearer',
  scope                 text,
  resource_owner_id     text,
  resource_owner_type   text,
  expires_at            timestamptz not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.fullscript_connections enable row level security;

create trigger set_fullscript_connections_updated_at
  before update on public.fullscript_connections
  for each row execute procedure public.set_updated_at();

-- Narrow, security-definer read so the client can show connect/disconnect
-- state without ever touching the token columns above.
create or replace function public.fullscript_connection_status()
returns table(connected boolean, connected_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select true, created_at
  from public.fullscript_connections
  where user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.fullscript_connection_status() to authenticated;
