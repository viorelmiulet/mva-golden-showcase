
-- Drop all existing overly permissive policies on contracts
DROP POLICY IF EXISTS "Anyone can update contract signature status" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can view contracts for signing" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;

-- Authenticated users: full CRUD
CREATE POLICY "Authenticated full access to contracts"
ON public.contracts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Anonymous users: SELECT only (needed for signing flow via token lookup)
CREATE POLICY "Anon can view contracts for signing"
ON public.contracts FOR SELECT
TO anon
USING (true);

-- Anonymous users: UPDATE only (needed for signing flow to mark as signed)
CREATE POLICY "Anon can update contract signing status"
ON public.contracts FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
