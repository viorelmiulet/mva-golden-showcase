-- Add columns to store contract file URLs
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS docx_url TEXT;