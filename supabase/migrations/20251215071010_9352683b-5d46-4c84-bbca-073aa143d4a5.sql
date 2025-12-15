-- Create table for site settings
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for displaying settings on public pages)
CREATE POLICY "Allow public read access to site_settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Allow authenticated users to manage settings
CREATE POLICY "Authenticated users can insert site_settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update site_settings" 
ON public.site_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete site_settings" 
ON public.site_settings 
FOR DELETE 
USING (true);

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('companyName', 'MVA Imobiliare'),
  ('phone', '+40767941512'),
  ('email', 'mvaperfectbusiness@gmail.com'),
  ('address', 'Chiajna, Strada Tineretului 17, Ilfov'),
  ('whatsappNumber', '+40767941512'),
  ('facebookUrl', 'https://facebook.com/mvaimobiliare'),
  ('instagramUrl', 'https://instagram.com/mvaimobiliare'),
  ('websiteUrl', 'https://mvaimobiliare.ro'),
  ('aboutText', 'MVA Imobiliare oferă servicii complete de intermediere imobiliară în zona de vest a Bucureștiului și Chiajna.'),
  ('footerText', '© 2025 MVA Imobiliare. Toate drepturile rezervate.');