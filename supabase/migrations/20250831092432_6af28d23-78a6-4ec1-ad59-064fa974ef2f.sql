-- Create business cards table
CREATE TABLE public.business_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  function_title TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  front_svg TEXT NOT NULL,
  back_svg TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view business cards
CREATE POLICY "Anyone can view business cards" 
ON public.business_cards 
FOR SELECT 
USING (true);

-- Create policy to allow everyone to insert business cards
CREATE POLICY "Anyone can insert business cards" 
ON public.business_cards 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow everyone to update business cards
CREATE POLICY "Anyone can update business cards" 
ON public.business_cards 
FOR UPDATE 
USING (true);

-- Create policy to allow everyone to delete business cards
CREATE POLICY "Anyone can delete business cards" 
ON public.business_cards 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_cards_updated_at
    BEFORE UPDATE ON public.business_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();