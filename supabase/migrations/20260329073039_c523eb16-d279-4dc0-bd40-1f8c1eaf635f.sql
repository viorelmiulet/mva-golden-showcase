
-- Fix rental_availability
ALTER POLICY "Authenticated users can manage availability" ON public.rental_availability TO authenticated;

-- Fix preset_inventory_items
ALTER POLICY "Authenticated users can delete preset items" ON public.preset_inventory_items TO authenticated;
ALTER POLICY "Authenticated users can insert preset items" ON public.preset_inventory_items TO authenticated;
ALTER POLICY "Authenticated users can update preset items" ON public.preset_inventory_items TO authenticated;
ALTER POLICY "Authenticated users can view preset items" ON public.preset_inventory_items TO authenticated;

-- Fix contract_inventory
ALTER POLICY "Authenticated users can delete inventory" ON public.contract_inventory TO authenticated;
ALTER POLICY "Authenticated users can insert inventory" ON public.contract_inventory TO authenticated;
ALTER POLICY "Authenticated users can update inventory" ON public.contract_inventory TO authenticated;
ALTER POLICY "Authenticated users can view inventory" ON public.contract_inventory TO authenticated;

-- Fix short_term_rentals
ALTER POLICY "Authenticated users can delete rentals" ON public.short_term_rentals TO authenticated;
ALTER POLICY "Authenticated users can insert rentals" ON public.short_term_rentals TO authenticated;
ALTER POLICY "Authenticated users can update rentals" ON public.short_term_rentals TO authenticated;
ALTER POLICY "Authenticated users can view all rentals" ON public.short_term_rentals TO authenticated;

-- Fix comodat_contracts
ALTER POLICY "Authenticated users can delete comodat contracts" ON public.comodat_contracts TO authenticated;
ALTER POLICY "Authenticated users can insert comodat contracts" ON public.comodat_contracts TO authenticated;
ALTER POLICY "Authenticated users can update comodat contracts" ON public.comodat_contracts TO authenticated;
ALTER POLICY "Authenticated users can view comodat contracts" ON public.comodat_contracts TO authenticated;

-- Fix exclusive_contracts
ALTER POLICY "Authenticated users can delete exclusive contracts" ON public.exclusive_contracts TO authenticated;
ALTER POLICY "Authenticated users can insert exclusive contracts" ON public.exclusive_contracts TO authenticated;
ALTER POLICY "Authenticated users can update exclusive contracts" ON public.exclusive_contracts TO authenticated;
ALTER POLICY "Authenticated users can view exclusive contracts" ON public.exclusive_contracts TO authenticated;

-- Fix site_settings write policies
ALTER POLICY "Authenticated users can delete site_settings" ON public.site_settings TO authenticated;
ALTER POLICY "Authenticated users can insert site_settings" ON public.site_settings TO authenticated;
ALTER POLICY "Authenticated users can update site_settings" ON public.site_settings TO authenticated;

-- Fix email_function_settings
ALTER POLICY "Anyone can delete email function settings" ON public.email_function_settings TO authenticated;
ALTER POLICY "Anyone can insert email function settings" ON public.email_function_settings TO authenticated;
ALTER POLICY "Anyone can update email function settings" ON public.email_function_settings TO authenticated;
ALTER POLICY "Anyone can view email function settings" ON public.email_function_settings TO authenticated;

-- Fix xml_import_sources
ALTER POLICY "Authenticated users can manage xml_import_sources" ON public.xml_import_sources TO authenticated;

-- Fix rental_ical_sources - drop duplicate public policies
DROP POLICY IF EXISTS "Anyone can delete ical sources" ON public.rental_ical_sources;
DROP POLICY IF EXISTS "Anyone can insert ical sources" ON public.rental_ical_sources;
DROP POLICY IF EXISTS "Anyone can update ical sources" ON public.rental_ical_sources;
DROP POLICY IF EXISTS "Anyone can view ical sources" ON public.rental_ical_sources;
