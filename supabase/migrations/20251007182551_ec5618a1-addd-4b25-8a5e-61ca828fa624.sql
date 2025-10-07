-- Create storage bucket for custom logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-card-logos', 'business-card-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for business card logos bucket
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-card-logos');

CREATE POLICY "Anyone can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-card-logos');

CREATE POLICY "Anyone can update their logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-card-logos');

CREATE POLICY "Anyone can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-card-logos');