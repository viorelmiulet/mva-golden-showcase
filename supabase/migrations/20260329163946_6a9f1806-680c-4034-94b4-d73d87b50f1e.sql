
-- Add SELECT policies for authenticated users on rental tables
CREATE POLICY "Authenticated can view rental_properties" ON public.rental_properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can view rental_tenants" ON public.rental_tenants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can view rental_payments" ON public.rental_payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can view rental_tickets" ON public.rental_tickets
  FOR SELECT TO authenticated USING (true);
