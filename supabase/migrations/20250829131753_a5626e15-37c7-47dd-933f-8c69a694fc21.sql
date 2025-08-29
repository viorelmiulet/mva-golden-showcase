-- Update RENEW RESIDENCE to remove specific information
UPDATE public.real_estate_projects 
SET 
  location_advantages = array_remove(location_advantages, 'La 10 minute de Centrul Vechi București'),
  payment_plans = array_remove(array_remove(payment_plans, 'Rate lunare fără dobândă - 36 luni'), 'Discount 3% pentru plata integrală')
WHERE name = 'RENEW RESIDENCE';