-- Create table for exclusive representation contracts
CREATE TABLE public.exclusive_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Beneficiary data
  beneficiary_name TEXT NOT NULL,
  beneficiary_prenume TEXT,
  beneficiary_cnp TEXT,
  beneficiary_seria_ci TEXT,
  beneficiary_numar_ci TEXT,
  beneficiary_ci_emitent TEXT,
  beneficiary_ci_data_emiterii DATE,
  beneficiary_adresa TEXT,
  beneficiary_phone TEXT,
  beneficiary_email TEXT,
  
  -- Property data
  property_type TEXT,
  property_address TEXT NOT NULL,
  property_rooms INTEGER,
  property_surface NUMERIC,
  property_land_surface NUMERIC,
  property_features TEXT,
  
  -- Contract terms
  sales_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  commission_percent NUMERIC,
  duration_months INTEGER DEFAULT 6,
  contract_date DATE NOT NULL,
  
  -- Signatures
  beneficiary_signature TEXT,
  agent_signature TEXT,
  beneficiary_signed_at TIMESTAMP WITH TIME ZONE,
  agent_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- PDF
  pdf_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft'
);

-- Enable RLS
ALTER TABLE public.exclusive_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view exclusive contracts"
ON public.exclusive_contracts
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert exclusive contracts"
ON public.exclusive_contracts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update exclusive contracts"
ON public.exclusive_contracts
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete exclusive contracts"
ON public.exclusive_contracts
FOR DELETE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_exclusive_contracts_updated_at
BEFORE UPDATE ON public.exclusive_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();