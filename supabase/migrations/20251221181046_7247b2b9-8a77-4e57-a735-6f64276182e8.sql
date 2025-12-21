-- Allow anonymous users to read contracts (needed for signature page)
DROP POLICY IF EXISTS "Anyone can view contracts" ON public.contracts;

CREATE POLICY "Anyone can view contracts" 
ON public.contracts 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anonymous users to update contracts (for signed status)
DROP POLICY IF EXISTS "Anyone can update contracts" ON public.contracts;

CREATE POLICY "Anyone can update contracts" 
ON public.contracts 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);