
CREATE TABLE public.fb_post_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.catalog_offers(id) ON DELETE CASCADE,
  message text NOT NULL,
  offer_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  groups_done text[] NOT NULL DEFAULT '{}',
  errors text[] NOT NULL DEFAULT '{}',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fb_post_queue_status_idx ON public.fb_post_queue(status);
CREATE INDEX fb_post_queue_offer_id_idx ON public.fb_post_queue(offer_id);
CREATE INDEX fb_post_queue_created_at_idx ON public.fb_post_queue(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_post_queue TO authenticated;
GRANT ALL ON public.fb_post_queue TO service_role;

ALTER TABLE public.fb_post_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view fb queue"
  ON public.fb_post_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert fb queue"
  ON public.fb_post_queue FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update fb queue"
  ON public.fb_post_queue FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete fb queue"
  ON public.fb_post_queue FOR DELETE TO authenticated USING (true);
