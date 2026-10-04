CREATE TABLE public.loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    person_name TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_loans_select" ON public.loans FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "rls_loans_insert" ON public.loans FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "rls_loans_update" ON public.loans FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "rls_loans_delete" ON public.loans FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE INDEX loans_user_idx ON public.loans (user_id);

CREATE OR REPLACE FUNCTION public.set_loans_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER loans_set_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_loans_updated_at();

REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.loans FROM authenticated;
REVOKE ALL ON public.loans FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
  END IF;
END;
$$;
