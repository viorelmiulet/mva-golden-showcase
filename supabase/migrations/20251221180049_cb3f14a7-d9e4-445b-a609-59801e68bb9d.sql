-- Fix RLS policy for contract_signatures INSERT
-- The current policy requires authentication but uses WITH CHECK (true) which should work
-- Let's recreate the INSERT policy properly

DROP POLICY IF EXISTS "Authenticated users can insert signatures" ON public.contract_signatures;

CREATE POLICY "Authenticated users can insert signatures" 
ON public.contract_signatures 
FOR INSERT 
TO authenticated
WITH CHECK (true);