
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  page_title text,
  referrer text,
  utm_source text,
  utm_medium text,
  device_type text,
  browser text,
  country text,
  duration_seconds integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert page_views" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon insert events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read page_views" ON public.page_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read events" ON public.events FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);
CREATE INDEX idx_events_created_at ON public.events (created_at DESC);
CREATE INDEX idx_events_event_type ON public.events (event_type);
