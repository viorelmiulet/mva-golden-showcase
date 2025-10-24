-- Ensure project-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update project images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete project images" ON storage.objects;

-- Create comprehensive storage policies for project-images bucket
CREATE POLICY "Anyone can view project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

CREATE POLICY "Anyone can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Anyone can update project images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-images');

CREATE POLICY "Anyone can delete project images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images');