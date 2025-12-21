-- Create storage bucket for contracts
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for contracts bucket
CREATE POLICY "Authenticated users can upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Authenticated users can view contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "Authenticated users can delete contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');