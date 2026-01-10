-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to email attachments
CREATE POLICY "Anyone can view email attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-attachments');

-- Allow service role to upload attachments (via edge function)
CREATE POLICY "Service role can upload email attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-attachments');