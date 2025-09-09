-- Fix security issue with search_path for the generate_api_key function
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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