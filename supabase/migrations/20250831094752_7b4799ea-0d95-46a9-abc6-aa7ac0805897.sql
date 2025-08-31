-- Add qr_link column to business_cards table
ALTER TABLE public.business_cards 
ADD COLUMN qr_link TEXT;

-- Update existing records to have a default WhatsApp link based on phone
UPDATE public.business_cards 
SET qr_link = CONCAT('https://wa.me/', REGEXP_REPLACE(phone, '[^0-9]', '', 'g'))
WHERE qr_link IS NULL;