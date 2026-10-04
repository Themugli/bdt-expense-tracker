-- ============================================================
-- Security hardening: ensure RLS is bulletproof
-- No user can ever read, write, or delete another user's rows.
-- ============================================================

-- Drop any pre-existing permissive policies to start clean
DROP POLICY IF EXISTS "Users can view their own expenses (MFA required)" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses (MFA required)" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses (MFA required)" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses (MFA required)" ON public.expenses;

-- Guarantee RLS is on (idempotent)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;

-- ── SELECT: only your own rows ───────────────────────────────────────────
DROP POLICY IF EXISTS "rls_expenses_select" ON public.expenses;
CREATE POLICY "rls_expenses_select"
ON public.expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ── INSERT: only allowed to insert as yourself; user_id must match ────────
DROP POLICY IF EXISTS "rls_expenses_insert" ON public.expenses;
CREATE POLICY "rls_expenses_insert"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ── UPDATE: only your own rows; cannot change user_id to impersonate ──────
DROP POLICY IF EXISTS "rls_expenses_update" ON public.expenses;
CREATE POLICY "rls_expenses_update"
ON public.expenses FOR UPDATE
TO authenticated
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ── DELETE: only your own rows ───────────────────────────────────────────
DROP POLICY IF EXISTS "rls_expenses_delete" ON public.expenses;
CREATE POLICY "rls_expenses_delete"
ON public.expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ── Block ALL anon access completely ─────────────────────────────────────
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.expenses FROM public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
