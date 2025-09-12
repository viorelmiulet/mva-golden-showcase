-- Add source column to catalog_offers to track where properties come from
ALTER TABLE public.catalog_offers 
ADD COLUMN source TEXT DEFAULT 'manual' NOT NULL;

-- Add index for better performance when filtering by source
CREATE INDEX idx_catalog_offers_source ON public.catalog_offers(source);

-- Add comments for documentation
COMMENT ON COLUMN public.catalog_offers.source IS 'Source of the property: manual, crm, website, api';