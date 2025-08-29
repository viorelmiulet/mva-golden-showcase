-- Create table for real estate projects
CREATE TABLE public.real_estate_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  developer TEXT,
  price_range TEXT NOT NULL,
  surface_range TEXT NOT NULL,
  rooms_range TEXT NOT NULL,
  description TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  location_advantages TEXT[] NOT NULL DEFAULT '{}',
  investment_details TEXT,
  payment_plans TEXT[] NOT NULL DEFAULT '{}',
  completion_date TEXT,
  total_units INTEGER,
  available_units INTEGER,
  is_recommended BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'available',
  detailed_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.real_estate_projects ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since it's for displaying information)
CREATE POLICY "Anyone can view real estate projects"
ON public.real_estate_projects
FOR SELECT
USING (true);

-- Create policy for authenticated users to manage projects (for admin purposes)
CREATE POLICY "Authenticated users can manage projects"
ON public.real_estate_projects
FOR ALL
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_real_estate_projects_updated_at
BEFORE UPDATE ON public.real_estate_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert detailed information about RENEW RESIDENCE
INSERT INTO public.real_estate_projects (
  name,
  location,
  developer,
  price_range,
  surface_range,
  rooms_range,
  description,
  features,
  amenities,
  location_advantages,
  investment_details,
  payment_plans,
  completion_date,
  total_units,
  available_units,
  is_recommended,
  status,
  detailed_info
) VALUES (
  'RENEW RESIDENCE',
  'Chiajna, Ilfov',
  'Dezvoltator Premium SRL',
  '€44,000 - €90,000',
  '32 - 65 mp',
  '1-2 camere',
  'Proiect modern cu finisaje premium și facilități contemporane în vestul capitalei. Renew Residence oferă apartamente moderne într-un cadru natural excepțional.',
  ARRAY['Finisaje Premium', 'Spații Verzi', 'Arhitectură Modernă', 'Sistem Ventilație Controlată'],
  ARRAY['Zonă de joacă pentru copii', 'Spații verzi amenajate', 'Zonă de fitness outdoor', 'Loc de parcare pentru fiecare apartament', 'Sistem de securitate 24/7', 'Interfon video', 'Lift modern Schindler'],
  ARRAY['La 10 minute de Centrul Vechi București', 'Acces rapid la Autostrada A1', 'Transport public excelent - STB si metrou', 'Zona în dezvoltare rapidă', 'Aproape de centrele comerciale (Plaza Romania, Veranda Mall)', 'Școli și grădinițe în apropiere'],
  'Investiție sigură cu potențial mare de creștere. Zona Chiajna este în plină dezvoltare, cu infrastructură modernă și acces facil către centrul capitalei. Prețurile proprietăților în zonă au crescut cu 15% în ultimul an.',
  ARRAY['Rate lunare fără dobândă - 36 luni', 'Plata în tranșe după stadiul de construcție', 'Discount 3% pentru plata integrală', 'Prima casă - sprijin pentru documentație'],
  'Decembrie 2025',
  120,
  89,
  true,
  'available',
  jsonb_build_object(
    'construction_company', 'Premium Construction SRL',
    'architect', 'Studio Arhitectura Moderna',
    'energy_class', 'A',
    'building_height', '4 etaje',
    'parking_spaces', 120,
    'green_spaces_percent', 35,
    'nearby_schools', ARRAY['Școala Gimnazială Nr. 1 Chiajna', 'Grădinița Rainbow Kids'],
    'nearby_shopping', ARRAY['Plaza Romania (15 min)', 'Veranda Mall (20 min)', 'Carrefour Militari (10 min)'],
    'public_transport', ARRAY['Autobuz 178, 135', 'Metrou - Stația Pacii (15 min)'],
    'medical_facilities', ARRAY['Clinica MedLife Chiajna', 'Farmacia Tei', 'Cabinet stomatologic Dr. Popescu'],
    'completion_stages', ARRAY['Fundație - 100%', 'Structură - 85%', 'Finisaje exterioare - 60%', 'Finisaje interioare - în curs']
  )
);

-- Insert EUROCASA RESIDENCE for comparison
INSERT INTO public.real_estate_projects (
  name,
  location,
  developer,
  price_range,
  surface_range,
  rooms_range,
  description,
  features,
  amenities,
  location_advantages,
  investment_details,
  payment_plans,
  completion_date,
  total_units,
  available_units,
  is_recommended,
  status,
  detailed_info
) VALUES (
  'EUROCASA RESIDENCE',
  'Chiajna, Ilfov',
  'EuroCasa Development',
  '€40,000 - €102,000',
  '30 - 75 mp',
  '1-3 camere',
  'Proiect imobiliar de excepție, situat în vestul capitalei cu design modern și facilități complete.',
  ARRAY['Design Modern', 'Sistem Securitate'],
  ARRAY['Zonă Comercială', 'Supraveghere video', 'Control acces', 'Lift', 'Parcaje subterane'],
  ARRAY['Zona în dezvoltare', 'Acces facil la centru', 'Transport public'],
  'Proiect cu potențial de investiție în zona de vest a Bucureștiului.',
  ARRAY['Plată în rate', 'Opțiuni de finanțare'],
  'Iunie 2026',
  200,
  156,
  false,
  'available',
  jsonb_build_object(
    'construction_company', 'EuroCasa Build',
    'energy_class', 'B+',
    'building_height', '6 etaje',
    'parking_spaces', 180
  )
);