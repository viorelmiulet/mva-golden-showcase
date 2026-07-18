CREATE TABLE IF NOT EXISTS public.fb_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fb_groups_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT fb_groups_url_not_blank CHECK (btrim(url) <> ''),
  CONSTRAINT fb_groups_url_unique UNIQUE (url)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_groups TO authenticated;
GRANT ALL ON public.fb_groups TO service_role;

ALTER TABLE public.fb_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Anon can insert fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Anon can update fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Anon can delete fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Authenticated can view fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Authenticated can insert fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Authenticated can update fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Authenticated can delete fb groups" ON public.fb_groups;

CREATE POLICY "Anon can view fb groups"
ON public.fb_groups FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon can insert fb groups"
ON public.fb_groups FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update fb groups"
ON public.fb_groups FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can delete fb groups"
ON public.fb_groups FOR DELETE TO anon
USING (true);

CREATE POLICY "Authenticated can view fb groups"
ON public.fb_groups FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert fb groups"
ON public.fb_groups FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update fb groups"
ON public.fb_groups FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete fb groups"
ON public.fb_groups FOR DELETE TO authenticated
USING (true);

DROP TRIGGER IF EXISTS update_fb_groups_updated_at ON public.fb_groups;
CREATE TRIGGER update_fb_groups_updated_at
BEFORE UPDATE ON public.fb_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.fb_groups (id, name, url, active, notes, updated_at)
SELECT
  CASE
    WHEN group_item->>'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (group_item->>'id')::uuid
    ELSE gen_random_uuid()
  END,
  COALESCE(NULLIF(btrim(group_item->>'name'), ''), 'Grup fără nume'),
  btrim(group_item->>'url'),
  COALESCE((group_item->>'active')::boolean, true),
  NULLIF(group_item->>'notes', ''),
  now()
FROM public.site_settings settings
CROSS JOIN LATERAL jsonb_array_elements(settings.value::jsonb) AS group_item
WHERE settings.key = 'facebook_groups'
  AND jsonb_typeof(settings.value::jsonb) = 'array'
  AND COALESCE(NULLIF(btrim(group_item->>'url'), ''), '') <> ''
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  notes = EXCLUDED.notes,
  updated_at = now();