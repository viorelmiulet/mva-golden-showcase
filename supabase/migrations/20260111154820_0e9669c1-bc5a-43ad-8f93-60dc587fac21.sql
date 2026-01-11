-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to property images
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Allow authenticated users to upload property images
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

-- Allow authenticated users to update their property images
CREATE POLICY "Authenticated users can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images');

-- Allow authenticated users to delete property images
CREATE POLICY "Authenticated users can delete property images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images');