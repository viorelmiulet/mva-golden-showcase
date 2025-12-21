-- Create table for contract signatures
CREATE TABLE public.contract_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  party_type TEXT NOT NULL CHECK (party_type IN ('proprietar', 'chirias')),
  signature_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_id, party_type)
);

-- Enable RLS
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (admin)
CREATE POLICY "Authenticated users can view signatures"
ON public.contract_signatures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert signatures"
ON public.contract_signatures FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update signatures"
ON public.contract_signatures FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete signatures"
ON public.contract_signatures FOR DELETE
TO authenticated
USING (true);

-- Policy for anonymous users to sign via token (public access for signing)
CREATE POLICY "Anyone can view signature by token"
ON public.contract_signatures FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anyone can update signature by token"
ON public.contract_signatures FOR UPDATE
TO anon
USING (signature_data IS NULL)
WITH CHECK (signature_data IS NOT NULL);

-- Add signature status columns to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS proprietar_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chirias_signed BOOLEAN DEFAULT false;