-- Create RLS policies for storage.objects to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload floor plans"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Allow authenticated users to update floor plans"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images');

CREATE POLICY "Allow authenticated users to delete floor plans"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');