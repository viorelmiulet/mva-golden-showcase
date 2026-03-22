ALTER TABLE public.real_estate_projects
ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS real_estate_projects_slug_unique_idx
ON public.real_estate_projects (slug)
WHERE slug IS NOT NULL;

UPDATE public.real_estate_projects
SET slug = 'eurocasa-residence-tineretului-35'
WHERE name = 'Eurocasa Residence Tineretului 35';

UPDATE public.real_estate_projects
SET slug = 'eurocasa-residence-tineretului-65'
WHERE name = 'Eurocasa Residence Tineretului 65';

UPDATE public.real_estate_projects
SET slug = 'orhideea-residence-6'
WHERE name = 'Orhideea Residence 6';

UPDATE public.real_estate_projects
SET slug = 'renew-residence'
WHERE name = 'Renew Residence';