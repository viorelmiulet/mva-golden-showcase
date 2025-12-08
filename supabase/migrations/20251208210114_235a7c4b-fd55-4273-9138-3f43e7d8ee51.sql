-- Add videos field to real_estate_projects for storing YouTube video URLs
ALTER TABLE public.real_estate_projects 
ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;