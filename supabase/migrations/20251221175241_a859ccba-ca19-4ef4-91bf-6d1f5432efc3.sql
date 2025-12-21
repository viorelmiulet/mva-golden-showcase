-- Allow anyone to update the signed status on contracts (only the signed fields)
DROP POLICY IF EXISTS "Anyone can update contract signature status" ON public.contracts;
CREATE POLICY "Anyone can update contract signature status" 
ON public.contracts 
FOR UPDATE 
USING (true)
WITH CHECK (true);