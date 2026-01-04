-- Adaugă politici RLS pentru rental_ical_sources (admin only)
CREATE POLICY "Admins can manage ical sources"
ON public.rental_ical_sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Pentru select, permitem și agenților
CREATE POLICY "Agents can view ical sources"
ON public.rental_ical_sources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'agent')
  )
);