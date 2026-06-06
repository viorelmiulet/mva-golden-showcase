UPDATE public.catalog_offers
SET slug = public.slugify_text(coalesce(nullif(btrim(title), ''), 'proprietate'))
       || '-' || substring(replace(id::text, '-', '') from 1 for 4)
WHERE availability_status = 'sold'
  AND coalesce(btrim(title), '') <> '';