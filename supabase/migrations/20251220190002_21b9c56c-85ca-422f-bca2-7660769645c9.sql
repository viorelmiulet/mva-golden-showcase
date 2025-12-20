-- Add column for invoice file URL
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS invoice_file_url TEXT;

-- Create storage bucket for invoice files
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-files', 'invoice-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for invoice files bucket
CREATE POLICY "Authenticated users can upload invoice files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoice-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view invoice files"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete invoice files"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoice-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update invoice files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoice-files' AND auth.role() = 'authenticated');