ALTER TABLE public.catalog_offers
  ADD COLUMN IF NOT EXISTS homedirect_id text,
  ADD COLUMN IF NOT EXISTS homedirect_short_id text,
  ADD COLUMN IF NOT EXISTS homedirect_status text,
  ADD COLUMN IF NOT EXISTS homedirect_synced_at timestamp with time zone;