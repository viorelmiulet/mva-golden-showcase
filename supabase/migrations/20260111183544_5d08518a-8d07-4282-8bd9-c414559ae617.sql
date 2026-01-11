-- Create RLS policies for virtual-staging bucket to allow uploads

-- Allow authenticated users to upload files to generated-images folder
CREATE POLICY "Allow authenticated uploads to virtual-staging"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'virtual-staging');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to virtual-staging"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'virtual-staging');

-- Allow public read access (bucket is already public)
CREATE POLICY "Allow public read access to virtual-staging"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'virtual-staging');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from virtual-staging"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'virtual-staging');