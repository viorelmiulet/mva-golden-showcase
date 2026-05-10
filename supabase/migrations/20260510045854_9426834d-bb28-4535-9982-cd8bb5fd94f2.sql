
CREATE TABLE public.redirect_monitor_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE,
  expected_status integer NOT NULL DEFAULT 301,
  expected_location_pattern text,
  is_active boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.redirect_monitor_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid REFERENCES public.redirect_monitor_targets(id) ON DELETE CASCADE,
  url_tested text NOT NULL,
  expected_status integer NOT NULL,
  actual_status integer,
  actual_location text,
  is_healthy boolean NOT NULL DEFAULT false,
  response_time_ms integer,
  error_message text,
  alert_sent boolean NOT NULL DEFAULT false,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_redirect_checks_url_time ON public.redirect_monitor_checks(url_tested, checked_at DESC);
CREATE INDEX idx_redirect_checks_target_time ON public.redirect_monitor_checks(target_id, checked_at DESC);

ALTER TABLE public.redirect_monitor_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirect_monitor_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage redirect targets"
  ON public.redirect_monitor_targets FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins read redirect checks"
  ON public.redirect_monitor_checks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete redirect checks"
  ON public.redirect_monitor_checks FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_redirect_targets_updated_at
  BEFORE UPDATE ON public.redirect_monitor_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.redirect_monitor_targets (url, expected_status, expected_location_pattern, note) VALUES
  ('https://mvaimobiliare.ro/proprietati/old-name-7c0f', 301, '/proprietati/.+-7c0f', 'Short ID 7c0f -> slug canonic catalog_offers'),
  ('https://mvaimobiliare.ro/proprietati/garsoniera-12345', 301, '/proprietate/', 'Numeric pe ruta gresita -> /proprietate/'),
  ('https://mvaimobiliare.ro/proprietati/old-name-eb9a', 301, '/proprietati/.+-eb9a', 'Short ID eb9a -> slug canonic'),
  ('https://mvaimobiliare.ro/proprietati/old-name-d434', 301, '/proprietati/.+-d434', 'Short ID d434 -> slug canonic'),
  ('https://www.mvaimobiliare.ro/proprietati/old-name-7c0f', 301, 'mvaimobiliare\.ro/proprietati/', 'www -> apex + slug canonic'),
  ('https://mvaimobiliare.ro/proprietate/12345', 200, NULL, 'Bare numeric Immoflux -> 200 cu noindex (client redirect)');
