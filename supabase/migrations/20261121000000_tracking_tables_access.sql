-- ─────────────────────────────────────────────────────────────────────────────
-- Let Daily Tracking save to the user's account.
--
-- meal_logs and daily_tracking had RLS policies but no table grants for
-- `authenticated`, so every request failed with "permission denied" and the
-- page kept everything in browser localStorage instead. This grants access,
-- re-creates the own-rows-only policies (scoped to signed-in users), and adds
-- the daily totals the page tracks but the table had no columns for.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Daily totals the page logs (calories and protein; steps and water exist) ─
alter table public.daily_tracking
  add column if not exists calories  numeric,
  add column if not exists protein_g numeric;

-- ── Own rows only ────────────────────────────────────────────────────────────
drop policy if exists "Users manage their own meal logs" on public.meal_logs;
create policy "Users manage their own meal logs"
  on public.meal_logs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own daily tracking" on public.daily_tracking;
create policy "Users manage their own daily tracking"
  on public.daily_tracking for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Table access for signed-in users (RLS above limits it to their rows) ─────
grant select, insert, update, delete on public.meal_logs to authenticated;
grant select, insert, update, delete on public.daily_tracking to authenticated;
