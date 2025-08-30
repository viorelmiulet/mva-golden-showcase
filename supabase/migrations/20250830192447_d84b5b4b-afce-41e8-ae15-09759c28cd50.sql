-- Drop existing policies for catalog_offers
DROP POLICY IF EXISTS "Authenticated users can manage existing offers" ON public.catalog_offers;

-- Create new policies that allow public access
CREATE POLICY "Anyone can view catalog offers" 
ON public.catalog_offers 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert catalog offers" 
ON public.catalog_offers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update catalog offers" 
ON public.catalog_offers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete catalog offers" 
ON public.catalog_offers 
FOR DELETE 
USING (true);