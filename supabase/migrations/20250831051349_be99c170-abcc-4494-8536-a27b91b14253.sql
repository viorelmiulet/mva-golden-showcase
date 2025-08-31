-- Update existing properties with project names based on their titles

-- Update properties that mention "Militari Residence"
UPDATE catalog_offers 
SET project_name = 'Militari Residence'
WHERE (title ILIKE '%militari residence%' OR description ILIKE '%militari residence%') 
  AND (project_name IS NULL OR project_name = '');

-- Update properties that mention "Eurocasa"  
UPDATE catalog_offers 
SET project_name = 'Eurocasa Residence'
WHERE (title ILIKE '%eurocasa%' OR description ILIKE '%eurocasa%')
  AND (project_name IS NULL OR project_name = '');

-- Update properties that mention "Renew"
UPDATE catalog_offers 
SET project_name = 'Renew Residence' 
WHERE (title ILIKE '%renew%' OR description ILIKE '%renew%')
  AND (project_name IS NULL OR project_name = '');