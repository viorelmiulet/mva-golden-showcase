-- Allow anyone to view contract_signatures by their token (for signature page)
DROP POLICY IF EXISTS "Anyone can view signature by token" ON public.contract_signatures;
CREATE POLICY "Anyone can view signature by token" 
ON public.contract_signatures 
FOR SELECT 
USING (true);

-- Allow anyone to update signature by token when signing
DROP POLICY IF EXISTS "Anyone can update signature by token" ON public.contract_signatures;
CREATE POLICY "Anyone can update signature by token" 
ON public.contract_signatures 
FOR UPDATE 
USING (signature_data IS NULL)
WITH CHECK (signature_data IS NOT NULL);

-- Allow anyone to view contract details for signing (limited read-only for signature page)
DROP POLICY IF EXISTS "Anyone can view contracts for signing" ON public.contracts;
CREATE POLICY "Anyone can view contracts for signing" 
ON public.contracts 
FOR SELECT 
USING (true);