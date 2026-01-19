-- Set EUR as default currency for new catalog_offers
ALTER TABLE public.catalog_offers ALTER COLUMN currency SET DEFAULT 'EUR';