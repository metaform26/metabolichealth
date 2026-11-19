-- ─────────────────────────────────────────────────────────────────────────────
-- Lock down profiles.role and fix the recursive admin policy.
--
-- 1. Users could change their own `role` (the update policy only checked that
--    the row was theirs), so anyone could make themselves an admin. Updates are
--    now limited to the columns users are meant to edit.
-- 2. "Admins can view all profiles" read `profiles` from inside a policy on
--    `profiles`, so every read of the table failed with 42P17 (infinite
--    recursion). The admin check now goes through is_admin(), which runs as the
--    table owner and so doesn't re-enter the policies.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── is_admin(): "is the signed-in user an admin?" ───────────────────────────
-- SECURITY DEFINER runs it as the owner, bypassing RLS on the inner read. It
-- only ever answers about the caller (auth.uid()), so it exposes nothing else.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── Admin read policy, without the recursion ────────────────────────────────
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- ── Users may edit only their name and avatar, never their role ─────────────
-- Column-level privileges are checked before RLS, so an update that sets
-- `role` is rejected with "permission denied" however it is sent. To make
-- another column user-editable later, add it to this grant.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ── New rows can't self-assign a role either ─────────────────────────────────
-- Profiles are normally created by the handle_new_user() trigger (as
-- 'patient'); this closes the gap if a client inserts one directly.
drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id and role = 'patient');

-- ── Let signed-in users reach the table at all ───────────────────────────────
-- `authenticated` had no SELECT/INSERT on profiles, so even reading your own
-- row failed with "permission denied" (and an UPDATE needs SELECT to find its
-- row). RLS above still limits reads to your own row, or every row for admins.
grant select, insert on public.profiles to authenticated;
