-- Create table for viewing appointments
CREATE TABLE public.viewing_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  property_id UUID REFERENCES public.catalog_offers(id) ON DELETE SET NULL,
  property_title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.viewing_appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (agents/admins)
CREATE POLICY "Authenticated users can view all appointments" 
ON public.viewing_appointments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update appointments" 
ON public.viewing_appointments 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete appointments" 
ON public.viewing_appointments 
FOR DELETE 
TO authenticated
USING (true);

-- Allow public insert (for customers scheduling viewings)
CREATE POLICY "Anyone can create appointments" 
ON public.viewing_appointments 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_viewing_appointments_updated_at
BEFORE UPDATE ON public.viewing_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();