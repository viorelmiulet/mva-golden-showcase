-- Create catalog_offers table for WhatsApp catalog items
CREATE TABLE public.catalog_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_min INTEGER NOT NULL, -- in EUR
  price_max INTEGER NOT NULL, -- in EUR
  surface_min INTEGER, -- in sqm
  surface_max INTEGER, -- in sqm
  rooms INTEGER NOT NULL,
  location TEXT NOT NULL,
  project_name TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  features TEXT[] DEFAULT '{}'::text[],
  amenities TEXT[] DEFAULT '{}'::text[],
  availability_status TEXT DEFAULT 'available',
  contact_info JSONB,
  whatsapp_catalog_id TEXT, -- reference to WhatsApp catalog item
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view catalog offers" 
ON public.catalog_offers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage offers" 
ON public.catalog_offers 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_catalog_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_catalog_offers_updated_at
BEFORE UPDATE ON public.catalog_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_catalog_offers_updated_at();

-- Create indexes for better search performance
CREATE INDEX idx_catalog_offers_price ON public.catalog_offers (price_min, price_max);
CREATE INDEX idx_catalog_offers_rooms ON public.catalog_offers (rooms);
CREATE INDEX idx_catalog_offers_location ON public.catalog_offers (location);
CREATE INDEX idx_catalog_offers_surface ON public.catalog_offers (surface_min, surface_max);
CREATE INDEX idx_catalog_offers_availability ON public.catalog_offers (availability_status);

-- Insert some sample offers (you can replace these with real data)
INSERT INTO public.catalog_offers (
  title, description, price_min, price_max, surface_min, surface_max, 
  rooms, location, project_name, features, amenities, is_featured
) VALUES 
(
  'Apartament 2 camere modern - RENEW RESIDENCE',
  'Apartament cu 2 camere în complexul premium RENEW RESIDENCE, finisaje de lux, bucătărie echipată.',
  85000, 95000, 55, 65, 2, 'Chiajna, Vestul Bucureștiului',
  'RENEW RESIDENCE',
  ARRAY['Finisaje premium', 'Bucătărie echipată', 'Aer condiționat', 'Pardoseală în parchet'],
  ARRAY['Piscină', 'Sală fitness', 'Spații verzi', 'Parcare subterană'],
  true
),
(
  'Apartament 3 camere cu terasă - EUROCASA RESIDENCE',
  'Apartament spațios cu 3 camere și terasă mare, vedere la parc, locație premium.',
  120000, 140000, 75, 85, 3, 'Chiajna, Vestul Bucureștiului',
  'EUROCASA RESIDENCE',
  ARRAY['Terasă mare', 'Vedere la parc', 'Finisaje de lux', '2 băi'],
  ARRAY['Parc pentru copii', 'Zonă comercială', 'Transport în comun'],
  true
),
(
  'Apartament 1 cameră compact',
  'Apartament compact cu o cameră, ideal pentru investiție sau prima casă.',
  55000, 65000, 35, 45, 1, 'Chiajna, Vestul Bucureștiului',
  'RENEW RESIDENCE',
  ARRAY['Compact și funcțional', 'Finisaje moderne', 'Balcon'],
  ARRAY['Piscină', 'Sală fitness', 'Parcare'],
  false
);