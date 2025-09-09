-- Create api_keys table for external platform integration
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  description TEXT
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, we'll make it accessible without user authentication since it's for admin use)
CREATE POLICY "API keys are viewable by everyone" 
ON public.api_keys 
FOR SELECT 
USING (true);

CREATE POLICY "API keys can be created by anyone" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "API keys can be updated by anyone" 
ON public.api_keys 
FOR UPDATE 
USING (true);

CREATE POLICY "API keys can be deleted by anyone" 
ON public.api_keys 
FOR DELETE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate secure API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    key_prefix TEXT := 'mva_';
    random_part TEXT;
BEGIN
    -- Generate a random 32-character string
    random_part := encode(gen_random_bytes(24), 'base64');
    -- Remove any non-alphanumeric characters and make it URL safe
    random_part := translate(random_part, '+/=', 'ABC');
    
    RETURN key_prefix || random_part;
END;
$$;