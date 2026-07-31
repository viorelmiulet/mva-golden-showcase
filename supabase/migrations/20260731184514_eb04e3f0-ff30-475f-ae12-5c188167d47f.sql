CREATE TABLE IF NOT EXISTS public.app_runtime_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE ALL ON public.app_runtime_config FROM anon, authenticated;
GRANT ALL ON public.app_runtime_config TO service_role;

ALTER TABLE public.app_runtime_config ENABLE ROW LEVEL SECURITY;