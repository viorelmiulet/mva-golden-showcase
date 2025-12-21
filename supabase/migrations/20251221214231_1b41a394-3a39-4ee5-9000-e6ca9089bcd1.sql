-- Add public INSERT policy for inventory images (floor-plans folder)
-- This allows uploads from the inventory feature without strict auth check
CREATE POLICY "Public can upload inventory images via floor-plans"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-images' AND name LIKE 'floor-plans/inventory-%');