-- 1. Create an expenses table isolated to the authenticated user
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow SELECT only if the user is the owner AND has aal2 claim (MFA verified)
DROP POLICY IF EXISTS "Users can view their own expenses (MFA required)" ON public.expenses;
CREATE POLICY "Users can view their own expenses (MFA required)"
ON public.expenses FOR SELECT
TO authenticated
USING (
    (select auth.uid()) = user_id 
    AND (select auth.jwt()->>'aal') = 'aal2'
);

-- 4. Policy: Allow INSERT only if the user is the owner AND has aal2 claim (MFA verified)
DROP POLICY IF EXISTS "Users can insert their own expenses (MFA required)" ON public.expenses;
CREATE POLICY "Users can insert their own expenses (MFA required)"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.uid()) = user_id 
    AND (select auth.jwt()->>'aal') = 'aal2'
);

-- 5. Policy: Allow UPDATE only if the user is the owner AND has aal2 claim (MFA verified)
DROP POLICY IF EXISTS "Users can update their own expenses (MFA required)" ON public.expenses;
CREATE POLICY "Users can update their own expenses (MFA required)"
ON public.expenses FOR UPDATE
TO authenticated
USING (
    (select auth.uid()) = user_id 
    AND (select auth.jwt()->>'aal') = 'aal2'
)
WITH CHECK (
    (select auth.uid()) = user_id 
    AND (select auth.jwt()->>'aal') = 'aal2'
);

-- 6. Policy: Allow DELETE only if the user is the owner AND has aal2 claim (MFA verified)
DROP POLICY IF EXISTS "Users can delete their own expenses (MFA required)" ON public.expenses;
CREATE POLICY "Users can delete their own expenses (MFA required)"
ON public.expenses FOR DELETE
TO authenticated
USING (
    (select auth.uid()) = user_id 
    AND (select auth.jwt()->>'aal') = 'aal2'
);
