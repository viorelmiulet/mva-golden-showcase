-- Drop the restrictive policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can manage existing offers" ON public.catalog_offers;

-- Create specific policies for update and delete operations
CREATE POLICY "Anyone can update catalog offers" 
ON public.catalog_offers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete catalog offers" 
ON public.catalog_offers 
FOR DELETE 
USING (true);