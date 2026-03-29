
-- Drop dependent tables first (they have FK to short_term_rentals)
DROP TABLE IF EXISTS public.rental_availability CASCADE;
DROP TABLE IF EXISTS public.rental_bookings CASCADE;
DROP TABLE IF EXISTS public.rental_ical_sources CASCADE;

-- Drop the main table
DROP TABLE IF EXISTS public.short_term_rentals CASCADE;
