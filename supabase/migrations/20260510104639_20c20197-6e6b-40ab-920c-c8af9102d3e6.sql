CREATE TABLE IF NOT EXISTS public.image_validation_cache (
  url_hash text PRIMARY KEY,
  url text NOT NULL,
  is_valid boolean NOT NULL,
  status_code integer,
  content_type text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_image_validation_cache_expires ON public.image_validation_cache(expires_at);

ALTER TABLE public.image_validation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read image validation cache"
ON public.image_validation_cache FOR SELECT
USING (true);
