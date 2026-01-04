-- Add policies for anon users as well (similar to other tables like short_term_rentals)
CREATE POLICY "Anyone can insert ical sources"
ON public.rental_ical_sources
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update ical sources"
ON public.rental_ical_sources
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete ical sources"
ON public.rental_ical_sources
FOR DELETE
USING (true);

CREATE POLICY "Anyone can view ical sources"
ON public.rental_ical_sources
FOR SELECT
USING (true);