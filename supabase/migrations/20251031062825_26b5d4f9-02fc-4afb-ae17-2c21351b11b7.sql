-- Add missing columns needed by immoflux-integration edge function
ALTER TABLE public.catalog_offers
  ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_catalog_id TEXT DEFAULT NULL;