-- Remove source_url column from catalog_offers table
ALTER TABLE public.catalog_offers 
DROP COLUMN source_url;