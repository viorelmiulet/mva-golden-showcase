ALTER TABLE public.catalog_offers ADD COLUMN IF NOT EXISTS legacy_slug text;
CREATE INDEX IF NOT EXISTS catalog_offers_legacy_slug_idx ON public.catalog_offers (legacy_slug);

CREATE OR REPLACE FUNCTION public.canonicalize_property_type(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE s text;
BEGIN
  s := lower(btrim(coalesce(raw, '')));
  s := translate(s, 'ăâîșşțţ', 'aaisstt');
  IF s = '' THEN RETURN NULL; END IF;
  IF s ~ 'teren|lot|parcela' THEN RETURN 'teren'; END IF;
  IF s ~ 'garsoniera|studio' THEN RETURN 'garsoniera'; END IF;
  IF s ~ 'casa|vila|duplex' THEN RETURN 'casa'; END IF;
  IF s ~ 'hala|depozit|industrial|logistic' THEN RETURN 'depozit'; END IF;
  IF s ~ 'comercial|birou' THEN RETURN 'spatiu comercial'; END IF;
  IF s ~ 'apartament|apartment' THEN RETURN 'apartament'; END IF;
  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_property_slug_db(
  property_id uuid,
  property_rooms integer,
  property_project_name text,
  property_zone text,
  property_location text,
  property_surface integer,
  property_floor integer,
  property_city text,
  property_type text,
  property_surface_land integer,
  property_title text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  parts text[] := ARRAY[]::text[];
  kind text;
  zone_value text;
  kebab_zone text;
  kebab_city text;
  surface integer;
BEGIN
  -- Canonical type from the stored type, falling back to the title, never a hardcoded default.
  kind := public.canonicalize_property_type(property_type);
  IF kind IS NULL THEN
    kind := public.canonicalize_property_type(property_title);
  END IF;
  IF kind IN ('apartament', 'garsoniera') OR kind IS NULL THEN
    IF coalesce(property_rooms, 0) <= 1 THEN kind := 'garsoniera'; ELSE kind := 'apartament'; END IF;
  END IF;

  parts := array_append(parts, public.slugify_text(kind));

  -- Rooms only make sense for dwellings with more than one room.
  IF kind IN ('apartament', 'casa') AND coalesce(property_rooms, 0) > 1 THEN
    parts := array_append(parts, property_rooms || '-camere');
  END IF;

  -- Surface: land area for teren, usable area otherwise.
  IF kind = 'teren' THEN
    surface := property_surface_land;
  ELSE
    surface := coalesce(property_surface, property_surface_land);
  END IF;
  IF surface IS NOT NULL AND surface > 0 THEN
    parts := array_append(parts, surface || 'mp');
  END IF;

  -- City
  IF property_city IS NOT NULL AND btrim(property_city) <> '' THEN
    kebab_city := public.slugify_text(property_city);
    IF kebab_city <> '' AND char_length(kebab_city) > 1
       AND NOT EXISTS (SELECT 1 FROM unnest(parts) AS part WHERE part LIKE '%' || kebab_city || '%') THEN
      parts := array_append(parts, kebab_city);
    END IF;
  END IF;

  -- Zone (skipped when it looks like coordinates)
  zone_value := coalesce(property_zone, property_location);
  IF zone_value IS NOT NULL AND btrim(zone_value) <> '' AND zone_value !~ '^\d|.*\d{2,}\.\d{3,}' THEN
    kebab_zone := public.slugify_text(split_part(zone_value, ',', 1));
    IF kebab_zone <> '' AND char_length(kebab_zone) > 2
       AND NOT EXISTS (SELECT 1 FROM unnest(parts) AS part WHERE part LIKE '%' || kebab_zone || '%') THEN
      parts := array_append(parts, kebab_zone);
    END IF;
  END IF;

  parts := array_append(parts, substring(replace(property_id::text, '-', '') from 1 for 4));

  RETURN array_to_string(parts, '-');
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := public.generate_property_slug_db(
      NEW.id, NEW.rooms, NEW.project_name, NEW.zone, NEW.location,
      NEW.surface_min, NEW.floor, NEW.city, NEW.property_type, NEW.surface_land, NEW.title
    );
    IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL AND btrim(OLD.slug) <> ''
       AND OLD.slug IS DISTINCT FROM NEW.slug THEN
      NEW.legacy_slug := OLD.slug;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.slug IS DISTINCT FROM OLD.slug
        AND OLD.slug IS NOT NULL AND btrim(OLD.slug) <> '' THEN
    -- Slug explicitly changed: keep the old URL redirectable.
    NEW.legacy_slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;