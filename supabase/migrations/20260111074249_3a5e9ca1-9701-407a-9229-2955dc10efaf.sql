-- Create table for email function configurations
CREATE TABLE public.email_function_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL UNIQUE,
  function_label TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_function_settings ENABLE ROW LEVEL SECURITY;

-- Public policies (same as other settings tables)
CREATE POLICY "Anyone can view email function settings"
ON public.email_function_settings
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert email function settings"
ON public.email_function_settings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update email function settings"
ON public.email_function_settings
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete email function settings"
ON public.email_function_settings
FOR DELETE
USING (true);

-- Insert default email functions
INSERT INTO public.email_function_settings (function_name, function_label, from_email, from_name) VALUES
  ('contact', 'Formular Contact', 'noreply@mvaimobiliare.ro', 'MVA Imobiliare'),
  ('reply', 'Răspuns Email', 'noreply@mvaimobiliare.ro', 'MVA Imobiliare'),
  ('viewing', 'Programări Vizionări', 'noreply@mvaimobiliare.ro', 'MVA Imobiliare'),
  ('contracts', 'Contracte', 'noreply@mvaimobiliare.ro', 'MVA Imobiliare'),
  ('notifications', 'Notificări', 'noreply@mvaimobiliare.ro', 'MVA Imobiliare');

-- Create trigger for updated_at
CREATE TRIGGER update_email_function_settings_updated_at
BEFORE UPDATE ON public.email_function_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();