
ALTER TABLE public.catalog_offers
  ADD COLUMN IF NOT EXISTS extra_sections jsonb,
  ADD COLUMN IF NOT EXISTS floor_label text,
  ADD COLUMN IF NOT EXISTS immoflux_slug text;

CREATE INDEX IF NOT EXISTS catalog_offers_immoflux_slug_idx
  ON public.catalog_offers (immoflux_slug)
  WHERE immoflux_slug IS NOT NULL;

-- Backfill immoflux_slug for existing immoflux rows using current columns
UPDATE public.catalog_offers
SET immoflux_slug = array_to_string(
  array_remove(ARRAY[
    CASE WHEN coalesce(rooms,1) <= 1 THEN 'garsoniera' ELSE 'apartament-' || rooms || '-camere' END,
    CASE WHEN surface_min IS NOT NULL AND surface_min > 0 THEN surface_min || 'mp' ELSE NULL END,
    CASE
      WHEN floor IS NOT NULL AND floor >= 0
      THEN CASE WHEN floor = 0 THEN 'parter' ELSE 'etaj-' || floor END
      ELSE NULL
    END,
    CASE
      WHEN zone IS NOT NULL AND btrim(zone) <> ''
      THEN nullif(public.slugify_text(split_part(zone, ',', 1)), '')
      ELSE NULL
    END,
    CASE
      WHEN city IS NOT NULL AND btrim(city) <> ''
      THEN nullif(public.slugify_text(split_part(city, ',', 1)), '')
      ELSE NULL
    END,
    regexp_replace(external_id, '^immoflux-', '')
  ], NULL),
  '-'
)
WHERE crm_source = 'immoflux'
  AND external_id IS NOT NULL
  AND (immoflux_slug IS NULL OR immoflux_slug = '');
