-- ─────────────────────────────────────────────────────────────────────────────
-- Let signed-in users read and write progress_check_ins through the Data API.
--
-- The live table only granted TRUNCATE, REFERENCES and TRIGGER to
-- `authenticated`, so every select/insert/update/delete from the app failed
-- with "permission denied" before the RLS policy was even checked. The
-- existing "Users manage their own check-ins" policy (FOR ALL, auth.uid() =
-- user_id) still limits each user to their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.progress_check_ins to authenticated;
