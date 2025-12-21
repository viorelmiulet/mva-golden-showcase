-- Add INSERT policy for inventory images in project-images bucket
CREATE POLICY "Authenticated users can upload inventory images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = 'inventory');

-- Add UPDATE policy for inventory images
CREATE POLICY "Authenticated users can update inventory images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = 'inventory');

-- Add DELETE policy for inventory images
CREATE POLICY "Authenticated users can delete inventory images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = 'inventory');