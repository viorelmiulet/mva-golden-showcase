-- Add source_url column to catalog_offers table to store original import URL
ALTER TABLE public.catalog_offers 
ADD COLUMN source_url TEXT;