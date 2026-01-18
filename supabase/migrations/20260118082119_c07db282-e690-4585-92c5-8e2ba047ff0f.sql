-- Add is_published column to catalog_offers
ALTER TABLE public.catalog_offers 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Add is_published column to real_estate_projects
ALTER TABLE public.real_estate_projects 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_catalog_offers_is_published ON public.catalog_offers(is_published);
CREATE INDEX IF NOT EXISTS idx_real_estate_projects_is_published ON public.real_estate_projects(is_published);