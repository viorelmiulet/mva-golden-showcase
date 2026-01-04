-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage iCal sources" ON public.rental_ical_sources;
DROP POLICY IF EXISTS "Admins can manage ical sources" ON public.rental_ical_sources;
DROP POLICY IF EXISTS "Agents can view ical sources" ON public.rental_ical_sources;

-- Create permissive policies for authenticated users (similar to other tables)
CREATE POLICY "Authenticated users can view ical sources"
ON public.rental_ical_sources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert ical sources"
ON public.rental_ical_sources
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ical sources"
ON public.rental_ical_sources
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete ical sources"
ON public.rental_ical_sources
FOR DELETE
TO authenticated
USING (true);