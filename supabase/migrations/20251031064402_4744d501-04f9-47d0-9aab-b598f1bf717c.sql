-- Add transaction_type column to catalog_offers table
ALTER TABLE catalog_offers 
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'sale';

-- Add a comment to explain the column
COMMENT ON COLUMN catalog_offers.transaction_type IS 'Type of transaction: sale, rent, lease, etc.';