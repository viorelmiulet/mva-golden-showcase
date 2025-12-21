-- Create table for contract inventory items
CREATE TABLE public.contract_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  condition TEXT DEFAULT 'buna',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view inventory"
ON public.contract_inventory FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert inventory"
ON public.contract_inventory FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory"
ON public.contract_inventory FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete inventory"
ON public.contract_inventory FOR DELETE
USING (true);