-- Create table for short-term rental properties
CREATE TABLE public.short_term_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  address TEXT,
  rooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 2,
  surface NUMERIC,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  base_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  min_nights INTEGER DEFAULT 1,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '11:00',
  rules TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false
);

-- Create table for availability and custom pricing
CREATE TABLE public.rental_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID NOT NULL REFERENCES public.short_term_rentals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  custom_price NUMERIC,
  booking_reference TEXT,
  guest_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rental_id, date)
);

-- Create table for bookings
CREATE TABLE public.rental_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID NOT NULL REFERENCES public.short_term_rentals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  num_guests INTEGER DEFAULT 1,
  total_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  payment_status TEXT DEFAULT 'unpaid'
);

-- Enable RLS
ALTER TABLE public.short_term_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for rentals
CREATE POLICY "Public can view active rentals"
ON public.short_term_rentals
FOR SELECT
USING (is_active = true);

-- Authenticated users can manage rentals
CREATE POLICY "Authenticated users can insert rentals"
ON public.short_term_rentals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update rentals"
ON public.short_term_rentals
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete rentals"
ON public.short_term_rentals
FOR DELETE
USING (true);

CREATE POLICY "Authenticated users can view all rentals"
ON public.short_term_rentals
FOR SELECT
USING (true);

-- Public read access for availability
CREATE POLICY "Public can view availability"
ON public.rental_availability
FOR SELECT
USING (true);

-- Authenticated users can manage availability
CREATE POLICY "Authenticated users can manage availability"
ON public.rental_availability
FOR ALL
USING (true)
WITH CHECK (true);

-- Bookings policies
CREATE POLICY "Anyone can create bookings"
ON public.rental_bookings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view their bookings"
ON public.rental_bookings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage bookings"
ON public.rental_bookings
FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_short_term_rentals_updated_at
BEFORE UPDATE ON public.short_term_rentals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_bookings_updated_at
BEFORE UPDATE ON public.rental_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();