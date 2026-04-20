-- Recreate slug generation function with new format
CREATE OR REPLACE FUNCTION public.generate_property_slug_db(
  property_id uuid,
  property_rooms integer,
  property_project_name text,
  property_zone text,
  property_location text,
  property_surface integer DEFAULT NULL,
  property_floor integer DEFAULT NULL,
  property_city text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  parts text[] := ARRAY[]::text[];
  zone_value text;
  kebab_zone text;
  kebab_city text;
  kebab_project text;
  short_id text;
BEGIN
  -- 1. Property type
  IF coalesce(property_rooms, 1) <= 1 THEN
    parts := array_append(parts, 'garsoniera');
  ELSE
    parts := array_append(parts, 'apartament-' || property_rooms || '-camere');
  END IF;

  -- 2. Surface
  IF property_surface IS NOT NULL AND property_surface > 0 THEN
    parts := array_append(parts, property_surface || 'mp');
  END IF;

  -- 3. Floor
  IF property_floor IS NOT NULL AND property_floor >= 0 THEN
    parts := array_append(parts, 'etaj-' || property_floor);
  END IF;

  -- 4. Project name
  IF property_project_name IS NOT NULL AND btrim(property_project_name) <> '' THEN
    kebab_project := public.slugify_text(property_project_name);
    IF kebab_project <> '' THEN
      parts := array_append(parts, kebab_project);
    END IF;
  END IF;

  -- 5. City
  IF property_city IS NOT NULL AND btrim(property_city) <> '' THEN
    kebab_city := public.slugify_text(property_city);
    IF kebab_city <> '' AND char_length(kebab_city) > 1 THEN
      IF NOT EXISTS (
        SELECT 1 FROM unnest(parts) AS part WHERE part LIKE '%' || kebab_city || '%'
      ) THEN
        parts := array_append(parts, kebab_city);
      END IF;
    END IF;
  END IF;

  -- 6. Zone (skip if looks like coordinates)
  zone_value := coalesce(property_zone, property_location);
  IF zone_value IS NOT NULL AND btrim(zone_value) <> '' THEN
    IF zone_value !~ '^\d|.*\d{2,}\.\d{3,}' THEN
      kebab_zone := public.slugify_text(split_part(zone_value, ',', 1));
      IF kebab_zone <> '' AND char_length(kebab_zone) > 2 THEN
        IF NOT EXISTS (
          SELECT 1 FROM unnest(parts) AS part WHERE part LIKE '%' || kebab_zone || '%'
        ) THEN
          parts := array_append(parts, kebab_zone);
        END IF;
      END IF;
    END IF;
  END IF;

  -- 7. Short ID for uniqueness
  short_id := substring(replace(property_id::text, '-', '') from 1 for 4);
  parts := array_append(parts, short_id);

  RETURN array_to_string(parts, '-');
END;
$function$;

-- Update trigger function to pass new fields
CREATE OR REPLACE FUNCTION public.auto_generate_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.slug := public.generate_property_slug_db(
    NEW.id,
    NEW.rooms,
    NEW.project_name,
    NEW.zone,
    NEW.location,
    NEW.surface_min,
    NEW.floor,
    NEW.city
  );
  RETURN NEW;
END;
$function$;

-- Update sitemap notification trigger to use new signature
CREATE OR REPLACE FUNCTION public.trigger_google_sitemap_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_url constant text := 'https://mvaimobiliare.ro';
  target_urls jsonb := jsonb_build_array(
    base_url,
    base_url || '/proprietati',
    base_url || '/complexe',
    base_url || '/blog'
  );
  property_slug text;
  should_notify boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'catalog_offers' THEN
    IF TG_OP = 'INSERT' THEN
      should_notify := coalesce(NEW.is_published, false) = true
        AND coalesce(NEW.availability_status, 'available') = 'available';
    ELSIF TG_OP = 'UPDATE' THEN
      should_notify := (
        coalesce(NEW.is_published, false) = true
        AND coalesce(NEW.availability_status, 'available') = 'available'
        AND (
          coalesce(OLD.is_published, false) IS DISTINCT FROM coalesce(NEW.is_published, false)
          OR coalesce(OLD.availability_status, 'available') IS DISTINCT FROM coalesce(NEW.availability_status, 'available')
        )
      );
    END IF;

    IF should_notify THEN
      property_slug := public.generate_property_slug_db(
        NEW.id,
        NEW.rooms,
        NEW.project_name,
        NEW.zone,
        NEW.location,
        NEW.surface_min,
        NEW.floor,
        NEW.city
      );

      target_urls := target_urls || jsonb_build_array(
        base_url || '/proprietati/' || property_slug
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'blog_posts' THEN
    IF coalesce(NEW.is_published, false) = true AND coalesce(NEW.slug, '') <> '' THEN
      IF TG_OP = 'INSERT' THEN
        should_notify := true;
      ELSIF TG_OP = 'UPDATE' THEN
        should_notify := (
          coalesce(OLD.updated_at, now()) IS DISTINCT FROM coalesce(NEW.updated_at, now())
          OR coalesce(OLD.slug, '') IS DISTINCT FROM coalesce(NEW.slug, '')
          OR coalesce(OLD.is_published, false) IS DISTINCT FROM coalesce(NEW.is_published, false)
          OR coalesce(OLD.title, '') IS DISTINCT FROM coalesce(NEW.title, '')
          OR coalesce(OLD.content, '') IS DISTINCT FROM coalesce(NEW.content, '')
        );
      END IF;

      IF should_notify THEN
        target_urls := target_urls || jsonb_build_array(
          base_url || '/blog/' || NEW.slug
        );
      END IF;
    END IF;
  END IF;

  IF should_notify THEN
    PERFORM public.notify_google_sitemap(target_urls);
  END IF;

  RETURN NEW;
END;
$function$;

-- Regenerate all existing slugs with new format
UPDATE public.catalog_offers
SET slug = public.generate_property_slug_db(
  id, rooms, project_name, zone, location, surface_min, floor, city
);