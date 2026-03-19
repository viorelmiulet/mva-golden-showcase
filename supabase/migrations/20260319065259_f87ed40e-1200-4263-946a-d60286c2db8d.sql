
-- Drop the partial index that doesn't work with upsert
DROP INDEX IF EXISTS idx_catalog_offers_external_id;

-- Add a proper unique constraint on external_id
ALTER TABLE public.catalog_offers
  DROP CONSTRAINT IF EXISTS catalog_offers_external_id_key;

ALTER TABLE public.catalog_offers
  ADD CONSTRAINT catalog_offers_external_id_key UNIQUE (external_id);
