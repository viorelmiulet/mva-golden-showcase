-- Add new offers from Storia MVA Imobiliare page
INSERT INTO public.catalog_offers (
  title, description, price_min, price_max, surface_min, surface_max, 
  rooms, location, project_name, features, amenities, is_featured
) VALUES 
(
  'Apartament 2 camere aprilie 2026 - Militari Residence',
  'Apartament cu 2 camere cu finalizare în aprilie 2026, situat în complexul Militari Residence. Apartament modern cu finisaje de calitate.',
  75500, 75500, 54, 54, 2, 'Militari, Sectorul 6, Bucuresti',
  'MILITARI RESIDENCE',
  ARRAY['Finalizare aprilie 2026', 'Apartament decomandat', 'Finisaje moderne', 'Etaj 3'],
  ARRAY['Complex rezidențial modern', 'Zonă dezvoltată', 'Acces transport public'],
  false
),
(
  'Apartament 2 camere mutare imediată - Militari Residence',
  'Apartament cu 2 camere disponibil pentru mutare imediată în complexul Militari Residence. Apartament gata de locuit.',
  65000, 65000, 49, 49, 2, 'Militari, Sectorul 6, Bucuresti',
  'MILITARI RESIDENCE',
  ARRAY['Mutare imediată', 'Apartament decomandat', 'Gata de locuit', 'Etaj 1'],
  ARRAY['Complex rezidențial modern', 'Zonă dezvoltată', 'Acces transport public'],
  true
),
(
  'Apartament 2 camere decomandat - Militari Residence',
  'Apartament decomandat cu 2 camere în complexul Militari Residence, spațios și bine compartimentat.',
  69500, 69500, 50, 50, 2, 'Militari, Sectorul 6, Bucuresti',
  'MILITARI RESIDENCE',
  ARRAY['Apartament decomandat', 'Bine compartimentat', 'Spațios', 'Etaj 1'],
  ARRAY['Complex rezidențial modern', 'Zonă dezvoltată', 'Acces transport public'],
  false
),
(
  'Garsonieră Militari Residence aprilie 2026',
  'Garsonieră modernă cu finalizare în aprilie 2026, perfectă pentru o persoană sau investiție.',
  46000, 46000, 35, 35, 1, 'Militari, Sectorul 6, Bucuresti',
  'MILITARI RESIDENCE',
  ARRAY['Finalizare aprilie 2026', 'Compact și funcțional', 'Ideal investiție', 'Etaj 1'],
  ARRAY['Complex rezidențial modern', 'Zonă dezvoltată', 'Acces transport public'],
  false
);