-- Allow anonymous (public) uploads to specific folders in project-images
CREATE POLICY "Public can upload floor plans and property images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'project-images'
  AND (storage.foldername(name))[1] IN ('floor-plans', 'properties')
);