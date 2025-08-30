-- Fix the first property (Garsoniera)
UPDATE catalog_offers 
SET 
  rooms = 1,
  surface_min = 35,
  surface_max = 35,
  location = 'Militari Residence, București Sector 6'
WHERE id = '978363ed-046f-4334-8268-aa92b2847099';

-- Fix the second property (2 rooms apartment) 
UPDATE catalog_offers 
SET 
  surface_min = 50,
  surface_max = 50,
  location = 'Militari Residence, București Sector 6'
WHERE id = '09796544-03c6-4428-a17c-950a6c08b6d9';