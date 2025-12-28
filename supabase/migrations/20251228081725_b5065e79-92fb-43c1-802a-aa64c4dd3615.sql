-- Create comodat contracts table
CREATE TABLE public.comodat_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Comodant (owner) data
  comodant_name TEXT NOT NULL,
  comodant_prenume TEXT,
  comodant_cnp TEXT,
  comodant_seria_ci TEXT,
  comodant_numar_ci TEXT,
  comodant_ci_emitent TEXT,
  comodant_ci_data_emiterii DATE,
  comodant_adresa TEXT,
  comodant_phone TEXT,
  comodant_email TEXT,
  
  -- Comodatar (borrower) data
  comodatar_name TEXT NOT NULL,
  comodatar_prenume TEXT,
  comodatar_cnp TEXT,
  comodatar_seria_ci TEXT,
  comodatar_numar_ci TEXT,
  comodatar_ci_emitent TEXT,
  comodatar_ci_data_emiterii DATE,
  comodatar_adresa TEXT,
  comodatar_phone TEXT,
  comodatar_email TEXT,
  
  -- Property data
  property_address TEXT NOT NULL,
  property_type TEXT,
  property_surface NUMERIC,
  property_rooms INTEGER,
  property_features TEXT,
  
  -- Contract details
  contract_date DATE NOT NULL,
  start_date DATE,
  duration_months INTEGER DEFAULT 12,
  purpose TEXT, -- scopul folosintei (locuinta, sediu social, etc.)
  
  -- Signatures
  comodant_signature TEXT,
  comodant_signed_at TIMESTAMP WITH TIME ZONE,
  comodatar_signature TEXT,
  comodatar_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Files
  pdf_url TEXT,
  docx_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft'
);

-- Enable RLS
ALTER TABLE public.comodat_contracts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view comodat contracts"
  ON public.comodat_contracts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comodat contracts"
  ON public.comodat_contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update comodat contracts"
  ON public.comodat_contracts FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete comodat contracts"
  ON public.comodat_contracts FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_comodat_contracts_updated_at
  BEFORE UPDATE ON public.comodat_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();