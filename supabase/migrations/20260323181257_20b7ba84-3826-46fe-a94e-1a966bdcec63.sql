
-- Drop overly permissive public policy
DROP POLICY IF EXISTS "Authenticated users can manage clauses" ON public.contract_clauses;

-- Authenticated users: full CRUD
CREATE POLICY "Authenticated users can manage clauses"
ON public.contract_clauses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
