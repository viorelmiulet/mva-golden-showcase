-- Update RLS policies for catalog_offers to allow public insert
DROP POLICY IF EXISTS "Authenticated users can manage offers" ON public.catalog_offers;

-- Allow anyone to insert catalog offers (for property scraping)
CREATE POLICY "Anyone can insert catalog offers" 
ON public.catalog_offers 
FOR INSERT 
WITH CHECK (true);

-- Keep authenticated users able to manage (update/delete) offers
CREATE POLICY "Authenticated users can manage existing offers" 
ON public.catalog_offers 
FOR ALL 
USING (auth.role() = 'authenticated'::text);