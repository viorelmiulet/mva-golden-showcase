-- Allow authenticated users to upload to complexes folder specifically
CREATE POLICY "Allow upload to complexes folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'complexes'
);

-- Allow authenticated users to update complexes images
CREATE POLICY "Allow update complexes images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'complexes'
);

-- Allow authenticated users to delete complexes images
CREATE POLICY "Allow delete complexes images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'complexes'
);