-- Create table for XML import history
CREATE TABLE public.xml_import_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  import_count INTEGER NOT NULL DEFAULT 1,
  last_mapping JSONB
);

-- Enable RLS
ALTER TABLE public.xml_import_sources ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can manage xml_import_sources" 
ON public.xml_import_sources 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create unique index on URL to prevent duplicates
CREATE UNIQUE INDEX idx_xml_import_sources_url ON public.xml_import_sources(url);