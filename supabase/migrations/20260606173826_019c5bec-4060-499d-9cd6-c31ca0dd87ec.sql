UPDATE public.catalog_offers
SET slug = public.generate_property_slug_db(
  id, rooms, project_name, zone, location, surface_min, floor, city
)
WHERE availability_status = 'sold';