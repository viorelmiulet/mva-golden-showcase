ALTER TABLE public.catalog_offers
  ADD COLUMN IF NOT EXISTS street_fronts integer,
  ADD COLUMN IF NOT EXISTS street_front_length numeric,
  ADD COLUMN IF NOT EXISTS access_road_width numeric,
  ADD COLUMN IF NOT EXISTS land_classification text,
  ADD COLUMN IF NOT EXISTS garages integer,
  ADD COLUMN IF NOT EXISTS source_codes jsonb;