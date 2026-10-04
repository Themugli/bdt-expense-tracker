-- Ensure ledger_id always matches the user's own auth.uid() or 'default' (or local IDs)
-- Wait, local ids start with usr_... and when migrated they are kept!
-- So ledger_id can be ANY string for local users migrating to cloud.
-- We CANNOT enforce ledger_id = user_id::text. RLS already handles the security.

-- Missing Database Indexes
DROP INDEX IF EXISTS expenses_user_ledger_date_idx;
CREATE INDEX IF NOT EXISTS expenses_user_ledger_date_created_idx 
ON public.expenses (user_id, ledger_id, date DESC, created_at DESC);
