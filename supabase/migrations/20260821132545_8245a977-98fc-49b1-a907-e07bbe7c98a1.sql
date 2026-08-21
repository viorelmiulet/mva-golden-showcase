CREATE TABLE public.extension_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Extensie Chrome Facebook Post',
  scope text NOT NULL DEFAULT 'facebook-post',
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);
GRANT ALL ON public.extension_api_keys TO service_role;
ALTER TABLE public.extension_api_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.extension_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id uuid REFERENCES public.extension_api_keys(id) ON DELETE SET NULL,
  listing_id text,
  platform text NOT NULL DEFAULT 'facebook',
  group_id text,
  group_name text,
  status text NOT NULL,
  published_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.extension_publications TO service_role;
ALTER TABLE public.extension_publications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.extension_api_usage (
  id bigserial PRIMARY KEY,
  key_id uuid REFERENCES public.extension_api_keys(id) ON DELETE CASCADE,
  endpoint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.extension_api_usage TO service_role;
ALTER TABLE public.extension_api_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_extension_api_usage_key_time ON public.extension_api_usage (key_id, created_at DESC);
CREATE INDEX idx_extension_publications_created ON public.extension_publications (created_at DESC);

CREATE TRIGGER update_extension_api_keys_updated_at
BEFORE UPDATE ON public.extension_api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();