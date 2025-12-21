-- Remove authentication requirement for signature operations
-- Allow anonymous users to view, update and delete signatures

DROP POLICY IF EXISTS "Authenticated users can view signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Authenticated users can update signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Authenticated users can delete signatures" ON public.contract_signatures;

-- Allow anyone to view signatures
CREATE POLICY "Anyone can view signatures" 
ON public.contract_signatures 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anyone to update signatures
CREATE POLICY "Anyone can update signatures" 
ON public.contract_signatures 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to delete signatures
CREATE POLICY "Anyone can delete signatures" 
ON public.contract_signatures 
FOR DELETE 
TO anon, authenticated
USING (true);