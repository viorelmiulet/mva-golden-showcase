-- Add INSERT policy for contracts bucket
CREATE POLICY "Allow authenticated users to upload contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts');

-- Add UPDATE policy for contracts bucket
CREATE POLICY "Allow authenticated users to update contracts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts')
WITH CHECK (bucket_id = 'contracts');