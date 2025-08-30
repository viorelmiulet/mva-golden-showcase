-- Add currency column to catalog_offers table to store original currency
ALTER TABLE public.catalog_offers 
ADD COLUMN currency TEXT DEFAULT 'EUR';