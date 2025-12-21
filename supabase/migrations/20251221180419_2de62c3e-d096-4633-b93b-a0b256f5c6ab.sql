-- Allow anyone to insert signatures (since admin uses local auth, not Supabase auth)
DROP POLICY IF EXISTS "Allow authenticated insert signatures" ON public.contract_signatures;

-- Create policy for both anon and authenticated roles
CREATE POLICY "Allow insert signatures" 
ON public.contract_signatures 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);