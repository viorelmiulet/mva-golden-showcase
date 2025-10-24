-- Fix RLS policies for catalog_offers
DROP POLICY IF EXISTS "Authenticated users can insert catalog offers" ON catalog_offers;

CREATE POLICY "Authenticated users can insert catalog offers"
ON catalog_offers FOR INSERT
WITH CHECK (true);

-- Check why main_image is not being saved properly
-- Let's look at the actual recent updates
SELECT id, name, main_image, updated_at 
FROM real_estate_projects 
WHERE updated_at > '2025-10-24 05:40:00'::timestamptz 
ORDER BY updated_at DESC;