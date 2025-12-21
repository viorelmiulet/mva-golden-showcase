-- Add images column to contract_inventory table
ALTER TABLE public.contract_inventory 
ADD COLUMN images text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.contract_inventory.images IS 'Array of image URLs for this inventory item';