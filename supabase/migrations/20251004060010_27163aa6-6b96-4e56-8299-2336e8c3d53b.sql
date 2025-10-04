-- Add transaction_type column to catalog_offers table
ALTER TABLE public.catalog_offers 
ADD COLUMN transaction_type text NOT NULL DEFAULT 'sale';

-- Add a comment to explain the column
COMMENT ON COLUMN public.catalog_offers.transaction_type IS 'Type of transaction: sale (vânzare) or rent (chirie)';

-- Create an index for better query performance
CREATE INDEX idx_catalog_offers_transaction_type ON public.catalog_offers(transaction_type);