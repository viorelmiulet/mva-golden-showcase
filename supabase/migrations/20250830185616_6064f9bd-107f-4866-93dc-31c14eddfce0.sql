-- Delete all properties except the most recent one
DELETE FROM catalog_offers 
WHERE id NOT IN (
  SELECT id FROM catalog_offers 
  ORDER BY created_at DESC 
  LIMIT 1
);