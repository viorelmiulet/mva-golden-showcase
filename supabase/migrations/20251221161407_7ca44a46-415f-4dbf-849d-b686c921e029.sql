-- Create contracts table for storing generated contracts
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Client data
  client_name TEXT NOT NULL,
  client_prenume TEXT,
  client_cnp TEXT,
  client_seria_ci TEXT,
  client_numar_ci TEXT,
  client_adresa TEXT,
  
  -- Property data
  property_address TEXT NOT NULL,
  property_price NUMERIC,
  property_surface NUMERIC,
  property_currency TEXT DEFAULT 'EUR',
  
  -- Contract data
  contract_type TEXT NOT NULL CHECK (contract_type IN ('vanzare-cumparare', 'inchiriere', 'precontract')),
  contract_date DATE NOT NULL,
  duration_months INTEGER,
  advance_percent TEXT,
  
  -- Metadata
  pdf_generated BOOLEAN DEFAULT true,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view contracts" 
ON public.contracts 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert contracts" 
ON public.contracts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contracts" 
ON public.contracts 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete contracts" 
ON public.contracts 
FOR DELETE 
USING (true);