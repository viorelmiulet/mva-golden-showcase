-- Drop all existing INSERT policies and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can insert signatures" ON public.contract_signatures;

-- Create a simpler policy that allows any authenticated user to insert
CREATE POLICY "Allow authenticated insert signatures" 
ON public.contract_signatures 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also ensure the table has RLS enabled properly
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;