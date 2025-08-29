-- Update RENEW RESIDENCE total units to 48
UPDATE public.real_estate_projects 
SET 
  total_units = 48,
  available_units = CASE 
    -- If available units were more than 48, set to 48. Otherwise keep proportional
    WHEN available_units > 48 THEN 48
    ELSE ROUND((available_units::float / total_units::float) * 48)::integer
  END,
  detailed_info = jsonb_set(
    detailed_info, 
    '{parking_spaces}', 
    '48'::jsonb
  )
WHERE name = 'RENEW RESIDENCE';