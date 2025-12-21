-- Adaugă coloana preferences în tabelul clients pentru a stoca preferințele de proprietăți
ALTER TABLE public.clients 
ADD COLUMN preferences JSONB DEFAULT NULL;

-- Comentariu pentru a documenta structura așteptată a preferințelor
COMMENT ON COLUMN public.clients.preferences IS 'JSON cu preferințele clientului: {min_price, max_price, min_surface, max_surface, rooms, location, features[], property_type}';
