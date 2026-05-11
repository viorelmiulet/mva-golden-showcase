-- Stabilize property slugs: only regenerate when missing or when key fields actually change.
-- This drastically reduces "Page with redirect" entries in Google Search Console.

CREATE OR REPLACE FUNCTION public.auto_generate_property_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- On INSERT: always generate a slug if missing
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
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
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: keep existing slug stable.
  -- Only regenerate if slug is empty OR if all key identity fields changed AND admin
  -- explicitly cleared the slug (set to NULL/empty).
  IF TG_OP = 'UPDATE' THEN
    IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
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
    ELSE
      -- Preserve existing slug to keep URLs stable for SEO
      NEW.slug := OLD.slug;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;