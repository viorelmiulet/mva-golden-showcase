
-- Add new columns to catalog_offers for full CRM mapping
ALTER TABLE public.catalog_offers
  ADD COLUMN IF NOT EXISTS crm_source text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kitchens integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_ac boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_internet boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_tv boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_security boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_electricity boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_water boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_gas boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_wood_floors boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_phone boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS exclusivity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agency_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS appartment_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS build_materials text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS property_subtype text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS date_added timestamp with time zone DEFAULT NULL;

-- Create unique index on external_id for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_offers_external_id 
  ON public.catalog_offers (external_id) 
  WHERE external_id IS NOT NULL;
