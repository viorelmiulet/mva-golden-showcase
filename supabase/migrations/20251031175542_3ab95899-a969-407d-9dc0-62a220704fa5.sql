-- Add SELECT policy for storage objects
CREATE POLICY "Allow authenticated users to read project images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'project-images');

-- Ensure public read access to project-images bucket
CREATE POLICY "Allow public read access to project images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');