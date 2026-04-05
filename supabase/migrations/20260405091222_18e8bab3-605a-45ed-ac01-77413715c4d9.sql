
-- Add slug column to catalog_offers
ALTER TABLE public.catalog_offers ADD COLUMN IF NOT EXISTS slug text;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_catalog_offers_slug ON public.catalog_offers (slug);

-- Create trigger function to auto-generate slug
CREATE OR REPLACE FUNCTION public.auto_generate_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.slug := public.generate_property_slug_db(
    NEW.id,
    NEW.rooms,
    NEW.project_name,
    NEW.zone,
    NEW.location
  );
  RETURN NEW;
END;
$$;

-- Create trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_auto_slug_catalog_offers ON public.catalog_offers;
CREATE TRIGGER trg_auto_slug_catalog_offers
  BEFORE INSERT OR UPDATE OF rooms, project_name, zone, location
  ON public.catalog_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_property_slug();

-- Backfill existing rows
UPDATE public.catalog_offers
SET slug = public.generate_property_slug_db(id, rooms, project_name, zone, location)
WHERE slug IS NULL;
