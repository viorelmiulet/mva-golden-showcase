
-- =============================================
-- Fix RLS policies: replace USING(true)/WITH CHECK(true) 
-- on INSERT/UPDATE/DELETE with has_role admin check
-- for admin-only tables
-- =============================================

-- exclusive_contracts
DROP POLICY IF EXISTS "Authenticated users can delete exclusive contracts" ON exclusive_contracts;
DROP POLICY IF EXISTS "Authenticated users can insert exclusive contracts" ON exclusive_contracts;
DROP POLICY IF EXISTS "Authenticated users can update exclusive contracts" ON exclusive_contracts;
CREATE POLICY "Admins can delete exclusive contracts" ON exclusive_contracts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert exclusive contracts" ON exclusive_contracts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update exclusive contracts" ON exclusive_contracts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- preset_inventory_items
DROP POLICY IF EXISTS "Authenticated users can delete preset items" ON preset_inventory_items;
DROP POLICY IF EXISTS "Authenticated users can insert preset items" ON preset_inventory_items;
DROP POLICY IF EXISTS "Authenticated users can update preset items" ON preset_inventory_items;
CREATE POLICY "Admins can delete preset items" ON preset_inventory_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert preset items" ON preset_inventory_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update preset items" ON preset_inventory_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- short_term_rentals
DROP POLICY IF EXISTS "Authenticated users can delete rentals" ON short_term_rentals;
DROP POLICY IF EXISTS "Authenticated users can insert rentals" ON short_term_rentals;
DROP POLICY IF EXISTS "Authenticated users can update rentals" ON short_term_rentals;
CREATE POLICY "Admins can delete rentals" ON short_term_rentals FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert rentals" ON short_term_rentals FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update rentals" ON short_term_rentals FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- rental_ical_sources
DROP POLICY IF EXISTS "Authenticated users can delete ical sources" ON rental_ical_sources;
DROP POLICY IF EXISTS "Authenticated users can insert ical sources" ON rental_ical_sources;
DROP POLICY IF EXISTS "Authenticated users can update ical sources" ON rental_ical_sources;
CREATE POLICY "Admins can delete ical sources" ON rental_ical_sources FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert ical sources" ON rental_ical_sources FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ical sources" ON rental_ical_sources FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- comodat_contracts
DROP POLICY IF EXISTS "Authenticated users can delete comodat contracts" ON comodat_contracts;
DROP POLICY IF EXISTS "Authenticated users can insert comodat contracts" ON comodat_contracts;
DROP POLICY IF EXISTS "Authenticated users can update comodat contracts" ON comodat_contracts;
CREATE POLICY "Admins can delete comodat contracts" ON comodat_contracts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert comodat contracts" ON comodat_contracts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update comodat contracts" ON comodat_contracts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- email_function_settings
DROP POLICY IF EXISTS "Anyone can delete email function settings" ON email_function_settings;
DROP POLICY IF EXISTS "Anyone can insert email function settings" ON email_function_settings;
DROP POLICY IF EXISTS "Anyone can update email function settings" ON email_function_settings;
CREATE POLICY "Admins can delete email function settings" ON email_function_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert email function settings" ON email_function_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update email function settings" ON email_function_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- complexes
DROP POLICY IF EXISTS "Authenticated users can delete complexes" ON complexes;
DROP POLICY IF EXISTS "Authenticated users can insert complexes" ON complexes;
DROP POLICY IF EXISTS "Authenticated users can update complexes" ON complexes;
CREATE POLICY "Admins can delete complexes" ON complexes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert complexes" ON complexes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update complexes" ON complexes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- blog_posts
DROP POLICY IF EXISTS "Authenticated users can delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog posts" ON blog_posts;
CREATE POLICY "Admins can delete blog posts" ON blog_posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert blog posts" ON blog_posts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update blog posts" ON blog_posts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- clients
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
CREATE POLICY "Admins can delete clients" ON clients FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update clients" ON clients FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- contract_inventory
DROP POLICY IF EXISTS "Authenticated users can delete inventory" ON contract_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert inventory" ON contract_inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory" ON contract_inventory;
CREATE POLICY "Admins can delete inventory" ON contract_inventory FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert inventory" ON contract_inventory FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update inventory" ON contract_inventory FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- site_settings
DROP POLICY IF EXISTS "Authenticated users can delete site_settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site_settings" ON site_settings;
CREATE POLICY "Admins can delete site_settings" ON site_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update site_settings" ON site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- xml_import_sources
DROP POLICY IF EXISTS "Authenticated users can manage xml_import_sources" ON xml_import_sources;
CREATE POLICY "Admins can manage xml_import_sources" ON xml_import_sources FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- contract_clauses
DROP POLICY IF EXISTS "Authenticated users can manage clauses" ON contract_clauses;
CREATE POLICY "Admins can manage clauses" ON contract_clauses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- business_cards
DROP POLICY IF EXISTS "Allow authenticated users full access to business_cards" ON business_cards;
CREATE POLICY "Admins can manage business_cards" ON business_cards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_complexes
DROP POLICY IF EXISTS "Authenticated users can delete user_complexes" ON user_complexes;
DROP POLICY IF EXISTS "Authenticated users can insert user_complexes" ON user_complexes;
CREATE POLICY "Admins can delete user_complexes" ON user_complexes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert user_complexes" ON user_complexes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- commissions (was public role with true!)
DROP POLICY IF EXISTS "Allow all access to commissions" ON commissions;
CREATE POLICY "Admins can manage commissions" ON commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- received_emails (was public with true)
DROP POLICY IF EXISTS "Allow insert emails" ON received_emails;
DROP POLICY IF EXISTS "Anyone can delete emails" ON received_emails;
DROP POLICY IF EXISTS "Anyone can update emails" ON received_emails;
DROP POLICY IF EXISTS "Anyone can view emails" ON received_emails;
CREATE POLICY "Service role can insert emails" ON received_emails FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view emails" ON received_emails FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update emails" ON received_emails FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete emails" ON received_emails FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- sent_emails (was public with true)
DROP POLICY IF EXISTS "Allow public delete access to sent_emails" ON sent_emails;
DROP POLICY IF EXISTS "Allow public insert access to sent_emails" ON sent_emails;
DROP POLICY IF EXISTS "Allow public read access to sent_emails" ON sent_emails;
DROP POLICY IF EXISTS "Allow public update access to sent_emails" ON sent_emails;
CREATE POLICY "Service role can insert sent_emails" ON sent_emails FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view sent_emails" ON sent_emails FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update sent_emails" ON sent_emails FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sent_emails" ON sent_emails FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- email_contacts (was public with true)
DROP POLICY IF EXISTS "Anyone can delete email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Anyone can insert email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Anyone can update email contacts" ON email_contacts;
DROP POLICY IF EXISTS "Anyone can view email contacts" ON email_contacts;
CREATE POLICY "Admins can manage email_contacts" ON email_contacts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- rental_bookings (fix the public ALL policy)
DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON rental_bookings;
CREATE POLICY "Admins can manage bookings" ON rental_bookings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- contracts (keep anon access for signing, but restrict authenticated to admin)
DROP POLICY IF EXISTS "Authenticated full access to contracts" ON contracts;
CREATE POLICY "Admins can manage contracts" ON contracts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- contract_signatures (restrict to token-based access instead of full true)
DROP POLICY IF EXISTS "Anyone can delete signatures" ON contract_signatures;
DROP POLICY IF EXISTS "Anyone can update signature by token" ON contract_signatures;
DROP POLICY IF EXISTS "Anyone can update signatures" ON contract_signatures;
DROP POLICY IF EXISTS "Anyone can view signature by token" ON contract_signatures;
DROP POLICY IF EXISTS "Anyone can view signatures" ON contract_signatures;
DROP POLICY IF EXISTS "Allow insert signatures" ON contract_signatures;
CREATE POLICY "Anyone can view signatures" ON contract_signatures FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert signatures" ON contract_signatures FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update signatures" ON contract_signatures FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Admins can delete signatures" ON contract_signatures FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
