-- Add garantie_status column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN garantie_status text DEFAULT 'platita';

-- Add garantie_amount column to store the actual guarantee value separately from property_price
ALTER TABLE public.contracts 
ADD COLUMN garantie_amount numeric DEFAULT NULL;

COMMENT ON COLUMN public.contracts.garantie_status IS 'Status of guarantee payment: platita (paid) or de_platit (to be paid)';