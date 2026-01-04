-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can upload rental images" ON storage.objects;

-- Ensure authenticated users can upload to rentals folder
CREATE POLICY "Authenticated users can upload to rentals folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'rentals'
);

-- Ensure authenticated users can update rentals images
CREATE POLICY "Authenticated users can update rentals images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'rentals'
);

-- Ensure authenticated users can delete rentals images  
CREATE POLICY "Authenticated users can delete rentals images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'rentals'
);