-- ─────────────────────────────────────────────────────────────────────────────
-- Revert Fullscript OAuth connection storage
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.fullscript_connection_status();
drop trigger if exists set_fullscript_connections_updated_at on public.fullscript_connections;
drop table if exists public.fullscript_connections;

-- Remove the throwaway debug account created while testing this integration.
delete from auth.users where email = 'claude-fullscript-debug-test@mailinator.com';
