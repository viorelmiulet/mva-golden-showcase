-- Add storage policy for rentals folder
CREATE POLICY "Authenticated users can upload rental images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = 'rentals');