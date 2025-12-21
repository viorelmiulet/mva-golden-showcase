-- Create table for preset inventory items
CREATE TABLE public.preset_inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT DEFAULT 'buna',
  location TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preset_inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies - only authenticated users can manage
CREATE POLICY "Authenticated users can view preset items"
ON public.preset_inventory_items
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert preset items"
ON public.preset_inventory_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update preset items"
ON public.preset_inventory_items
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete preset items"
ON public.preset_inventory_items
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_preset_inventory_items_updated_at
BEFORE UPDATE ON public.preset_inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default preset items
INSERT INTO public.preset_inventory_items (item_name, quantity, condition, location, sort_order) VALUES
('Frigider', 1, 'buna', 'Bucatarie', 1),
('Aragaz', 1, 'buna', 'Bucatarie', 2),
('Masina de spalat', 1, 'buna', 'Baie', 3),
('Canapea', 1, 'buna', 'Living', 4),
('Pat matrimonial', 1, 'buna', 'Dormitor', 5),
('Dulap haine', 1, 'buna', 'Dormitor', 6),
('Masa dining', 1, 'buna', 'Living', 7),
('Scaune', 4, 'buna', 'Living', 8),
('TV', 1, 'buna', 'Living', 9),
('Aer conditionat', 1, 'buna', 'Living', 10);