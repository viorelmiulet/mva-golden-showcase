-- Update existing offers with their Storia links
UPDATE public.catalog_offers 
SET storia_link = 'https://www.storia.ro/ro/oferta/apartament-2-camere-mutare-imediata-militari'
WHERE title LIKE '%mutare imediată%' AND project_name = 'MILITARI RESIDENCE';

UPDATE public.catalog_offers 
SET storia_link = 'https://www.storia.ro/ro/oferta/apartament-2-camere-decomandat-militari'
WHERE title LIKE '%decomandat%' AND project_name = 'MILITARI RESIDENCE';

UPDATE public.catalog_offers 
SET storia_link = 'https://www.storia.ro/ro/oferta/garsoniera-militari-residence-aprilie-2026'
WHERE title LIKE '%Garsonieră%' AND project_name = 'MILITARI RESIDENCE';

UPDATE public.catalog_offers 
SET storia_link = 'https://www.storia.ro/ro/oferta/apartament-2-camere-aprilie-2026-militari'
WHERE title LIKE '%aprilie 2026%' AND project_name = 'MILITARI RESIDENCE' AND rooms = 2;