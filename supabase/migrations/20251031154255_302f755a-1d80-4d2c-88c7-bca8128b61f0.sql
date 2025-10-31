-- Add floor_plan column to catalog_offers table
ALTER TABLE public.catalog_offers 
ADD COLUMN IF NOT EXISTS floor_plan text;

COMMENT ON COLUMN public.catalog_offers.floor_plan IS 'URL to the floor plan/schita image';