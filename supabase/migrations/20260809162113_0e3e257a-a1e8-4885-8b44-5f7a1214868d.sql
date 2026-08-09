CREATE TABLE public.property_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.catalog_offers(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.property_views TO service_role;

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages property views"
  ON public.property_views FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_property_views_property_time ON public.property_views (property_id, viewed_at DESC);
CREATE INDEX idx_property_views_dedupe ON public.property_views (property_id, visitor_hash, viewed_at DESC);