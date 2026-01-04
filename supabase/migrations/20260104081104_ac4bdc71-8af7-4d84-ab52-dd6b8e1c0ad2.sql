-- Drop restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload to rentals folder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update rentals images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete rentals images" ON storage.objects;

-- Create permissive policy for rentals folder (similar to floor-plans and properties)
CREATE POLICY "Allow upload to rentals folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'rentals'
);

-- Allow update for rentals folder
CREATE POLICY "Allow update rentals images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'rentals'
);

-- Allow delete for rentals folder  
CREATE POLICY "Allow delete rentals images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-images' 
  AND (storage.foldername(name))[1] = 'rentals'
);