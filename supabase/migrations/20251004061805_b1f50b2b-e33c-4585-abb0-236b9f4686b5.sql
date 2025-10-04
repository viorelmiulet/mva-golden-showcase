-- Update transaction_type based on text content in title and description
UPDATE public.catalog_offers
SET transaction_type = 'rent'
WHERE 
  transaction_type = 'sale' 
  AND (
    LOWER(title) LIKE '%inchiriere%' OR
    LOWER(title) LIKE '%inchiriez%' OR
    LOWER(title) LIKE '%de inchiriat%' OR
    LOWER(title) LIKE '%chirie%' OR
    LOWER(title) LIKE '%for rent%' OR
    LOWER(title) LIKE '%rent%' OR
    LOWER(description) LIKE '%inchiriere%' OR
    LOWER(description) LIKE '%inchiriez%' OR
    LOWER(description) LIKE '%de inchiriat%' OR
    LOWER(description) LIKE '%se inchiriaza%' OR
    LOWER(description) LIKE '%se inchiriază%' OR
    LOWER(description) LIKE '%spre inchiriere%' OR
    LOWER(description) LIKE '%oferim spre închiriere%' OR
    LOWER(description) LIKE '%oferim spre inchiriere%'
  );

-- Add comment explaining the update
COMMENT ON COLUMN public.catalog_offers.transaction_type IS 'Type of transaction: sale (vânzare) or rent (chirie) - auto-detected from title/description when possible';