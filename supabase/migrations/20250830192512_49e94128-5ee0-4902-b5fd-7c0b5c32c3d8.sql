-- Drop the authenticated users policy that restricts access
DROP POLICY IF EXISTS "Authenticated users can manage existing offers" ON public.catalog_offers;

-- Add specific policies for update and delete that allow public access
CREATE POLICY "Anyone can update catalog offers" 
ON public.catalog_offers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete catalog offers" 
ON public.catalog_offers 
FOR DELETE 
USING (true);