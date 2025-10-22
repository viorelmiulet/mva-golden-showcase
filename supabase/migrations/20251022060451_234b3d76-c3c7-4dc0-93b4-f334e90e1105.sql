-- Add project_id to catalog_offers to link properties to projects
ALTER TABLE public.catalog_offers 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.real_estate_projects(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_catalog_offers_project_id ON public.catalog_offers(project_id);

-- Add a column to track available units count for each room type
ALTER TABLE public.catalog_offers
ADD COLUMN IF NOT EXISTS available_units integer DEFAULT 1;