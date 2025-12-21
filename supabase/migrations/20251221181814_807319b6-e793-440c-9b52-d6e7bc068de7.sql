-- Allow anonymous users to read contract_signatures
DROP POLICY IF EXISTS "Anyone can view signature by token" ON public.contract_signatures;

CREATE POLICY "Anyone can view signature by token" 
ON public.contract_signatures 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anonymous users to update contract_signatures  
DROP POLICY IF EXISTS "Anyone can update signature by token" ON public.contract_signatures;

CREATE POLICY "Anyone can update signature by token" 
ON public.contract_signatures 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);