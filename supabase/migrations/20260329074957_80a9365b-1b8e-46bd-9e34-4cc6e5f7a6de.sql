
-- catalog_offers: restrict to admin
DROP POLICY IF EXISTS "Allow authenticated users to delete catalog_offers" ON catalog_offers;
DROP POLICY IF EXISTS "Allow authenticated users to insert catalog_offers" ON catalog_offers;
DROP POLICY IF EXISTS "Allow authenticated users to update catalog_offers" ON catalog_offers;
CREATE POLICY "Admins can delete catalog_offers" ON catalog_offers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert catalog_offers" ON catalog_offers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update catalog_offers" ON catalog_offers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- real_estate_projects: restrict to admin
DROP POLICY IF EXISTS "Allow authenticated users to delete real_estate_projects" ON real_estate_projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert real_estate_projects" ON real_estate_projects;
DROP POLICY IF EXISTS "Allow authenticated users to update real_estate_projects" ON real_estate_projects;
CREATE POLICY "Admins can delete real_estate_projects" ON real_estate_projects FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert real_estate_projects" ON real_estate_projects FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update real_estate_projects" ON real_estate_projects FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- rental_availability: restrict to admin
DROP POLICY IF EXISTS "Authenticated users can manage availability" ON rental_availability;
CREATE POLICY "Admins can manage availability" ON rental_availability FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- viewing_appointments: keep public INSERT, restrict UPDATE/DELETE to admin
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON viewing_appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON viewing_appointments;
CREATE POLICY "Admins can delete appointments" ON viewing_appointments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update appointments" ON viewing_appointments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
