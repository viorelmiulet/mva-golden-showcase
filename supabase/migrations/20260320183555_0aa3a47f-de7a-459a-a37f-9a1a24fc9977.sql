CREATE OR REPLACE FUNCTION public.slugify_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(
    regexp_replace(
      translate(lower(coalesce(input_text, '')),
        'ăâîșşțţáàäãåçéèëêíìïîñóòöõúùüûýÿ',
        'aaissttaaaaaceeeeiiiinoooouuuuyy'
      ),
      '[^a-z0-9]+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
$$;

CREATE OR REPLACE FUNCTION public.generate_property_slug_db(
  property_id uuid,
  property_rooms integer,
  property_project_name text,
  property_zone text,
  property_location text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  parts text[] := ARRAY[]::text[];
  zone_value text;
  kebab_zone text;
  short_id text;
BEGIN
  IF coalesce(property_rooms, 1) <= 1 THEN
    parts := array_append(parts, 'garsoniera');
  ELSE
    parts := array_append(parts, 'apartament-' || property_rooms || '-camere');
  END IF;

  IF property_project_name IS NOT NULL AND btrim(property_project_name) <> '' THEN
    parts := array_append(parts, public.slugify_text(property_project_name));
  END IF;

  zone_value := coalesce(property_zone, property_location);
  IF zone_value IS NOT NULL AND btrim(zone_value) <> '' THEN
    IF zone_value !~ '^\d|.*\d{2,}\.\d{3,}' THEN
      kebab_zone := public.slugify_text(split_part(zone_value, ',', 1));
      IF kebab_zone <> '' AND char_length(kebab_zone) > 2 THEN
        IF NOT EXISTS (
          SELECT 1
          FROM unnest(parts) AS part
          WHERE part LIKE '%' || kebab_zone || '%'
        ) THEN
          parts := array_append(parts, kebab_zone);
        END IF;
      END IF;
    END IF;
  END IF;

  short_id := substring(replace(property_id::text, '-', '') from 1 for 4);
  parts := array_append(parts, short_id);

  RETURN array_to_string(parts, '-');
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_google_sitemap(target_urls jsonb DEFAULT '[]'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sitemap_notifications (source, metadata)
  VALUES (
    'database_trigger',
    jsonb_build_object(
      'timestamp', now(),
      'target_urls', coalesce(target_urls, '[]'::jsonb)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_google_sitemap_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url constant text := 'https://mvaimobiliare.ro';
  target_urls jsonb := jsonb_build_array(
    base_url,
    base_url || '/proprietati',
    base_url || '/complexe',
    base_url || '/blog'
  );
  property_slug text;
BEGIN
  IF TG_TABLE_NAME = 'catalog_offers' THEN
    IF coalesce(NEW.is_published, true) = true
       AND coalesce(NEW.availability_status, 'available') = 'available' THEN
      property_slug := public.generate_property_slug_db(
        NEW.id,
        NEW.rooms,
        NEW.project_name,
        NEW.zone,
        NEW.location
      );

      target_urls := target_urls || jsonb_build_array(
        base_url || '/proprietati/' || property_slug
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'blog_posts' THEN
    IF coalesce(NEW.is_published, true) = true AND coalesce(NEW.slug, '') <> '' THEN
      target_urls := target_urls || jsonb_build_array(
        base_url || '/blog/' || NEW.slug
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'real_estate_projects' THEN
    target_urls := target_urls || jsonb_build_array(base_url || '/complexe');
  END IF;

  PERFORM public.notify_google_sitemap(target_urls);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_google_on_blog_change ON public.blog_posts;
CREATE TRIGGER notify_google_on_blog_change
AFTER INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_google_sitemap_notification();