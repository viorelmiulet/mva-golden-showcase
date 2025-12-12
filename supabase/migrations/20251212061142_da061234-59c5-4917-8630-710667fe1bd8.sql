-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can update commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can delete commissions" ON public.commissions;

-- Create new permissive policies for all authenticated users
CREATE POLICY "Allow all access to commissions" 
ON public.commissions 
FOR ALL 
USING (true)
WITH CHECK (true);