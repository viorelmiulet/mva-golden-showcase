CREATE OR REPLACE FUNCTION public.find_properties_by_id_prefix(prefix text)
RETURNS SETOF catalog_offers
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM catalog_offers
  WHERE id::text ILIKE prefix || '%'
  LIMIT 10;
$$;