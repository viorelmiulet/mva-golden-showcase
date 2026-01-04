-- Create table for iCal sources
CREATE TABLE public.rental_ical_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID NOT NULL REFERENCES public.short_term_rentals(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  ical_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  sync_interval_hours INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_ical_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage iCal sources" 
ON public.rental_ical_sources 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'agent')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_rental_ical_sources_updated_at
BEFORE UPDATE ON public.rental_ical_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();