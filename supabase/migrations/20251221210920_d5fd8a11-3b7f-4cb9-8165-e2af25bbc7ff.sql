-- Add UPDATE policy for contracts bucket
CREATE POLICY "Authenticated users can update contracts storage"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts')
WITH CHECK (bucket_id = 'contracts');