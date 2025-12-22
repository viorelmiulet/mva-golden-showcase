-- Create a storage bucket for virtual staging images
INSERT INTO storage.buckets (id, name, public)
VALUES ('virtual-staging', 'virtual-staging', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for virtual staging images"
ON storage.objects FOR SELECT
USING (bucket_id = 'virtual-staging');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload virtual staging images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'virtual-staging' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete virtual staging images"
ON storage.objects FOR DELETE
USING (bucket_id = 'virtual-staging' AND auth.role() = 'authenticated');