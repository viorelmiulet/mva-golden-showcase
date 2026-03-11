INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true);

CREATE POLICY "Public can view email assets" ON storage.objects FOR SELECT USING (bucket_id = 'email-assets');

CREATE POLICY "Authenticated users can upload email assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'email-assets' AND auth.uid() IS NOT NULL);