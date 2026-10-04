-- ============================================================
-- Expense sync: align schema with the app, harden RLS, enable Realtime
-- ============================================================

-- ── 1. Schema: add the fields the app actually uses ──────────────────────
-- ledger_id = the local "little ledger" profile id. It separates profiles
-- that share one Supabase account. It is NOT a security boundary — user_id
-- + RLS is. It only keeps profiles from seeing each other's entries.
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS ledger_id  TEXT        NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS category   TEXT        NOT NULL DEFAULT 'Uncategorized',
  ADD COLUMN IF NOT EXISTS note       TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags       TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Legacy column from the initial schema; the app doesn't use it.
ALTER TABLE public.expenses ALTER COLUMN description SET DEFAULT '';

-- Basic integrity guards (mirrors client-side validation)
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_amount_positive;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_len;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_len CHECK (char_length(category) BETWEEN 1 AND 40);
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_note_len;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_note_len CHECK (char_length(note) <= 80);
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_tags_len;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_tags_len CHECK (coalesce(array_length(tags, 1), 0) <= 12);

CREATE INDEX IF NOT EXISTS expenses_user_ledger_date_idx
  ON public.expenses (user_id, ledger_id, date DESC);

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION public.set_expenses_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS expenses_set_updated_at ON public.expenses;
CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_expenses_updated_at();

-- ── 2. RLS: owner-only, wrapped auth.uid() for per-statement caching ─────
-- The SELECT policy is what Realtime uses to decide whether to deliver an
-- INSERT/UPDATE event. If it doesn't match, the event is silently dropped.
DROP POLICY IF EXISTS "rls_expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "rls_expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "rls_expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "rls_expenses_delete" ON public.expenses;

CREATE POLICY "rls_expenses_select" ON public.expenses FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "rls_expenses_insert" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "rls_expenses_update" ON public.expenses FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "rls_expenses_delete" ON public.expenses FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── 3. Grants: least privilege ───────────────────────────────────────────
-- TRUNCATE bypasses RLS entirely; authenticated users must never hold it.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.expenses FROM authenticated;
REVOKE ALL ON public.expenses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

-- ── 4. Realtime: publish row changes for this table ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;
END;
$$;
