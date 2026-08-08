ALTER TABLE public.catalog_offers
  ADD COLUMN IF NOT EXISTS video_manual text,
  ADD COLUMN IF NOT EXISTS video_id text;

ALTER TABLE public.real_estate_projects
  ADD COLUMN IF NOT EXISTS video_manual text,
  ADD COLUMN IF NOT EXISTS video_id text;

CREATE INDEX IF NOT EXISTS idx_catalog_offers_video_id ON public.catalog_offers (video_id) WHERE video_id IS NOT NULL;