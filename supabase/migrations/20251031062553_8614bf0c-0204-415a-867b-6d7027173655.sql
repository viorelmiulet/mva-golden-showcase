-- Create real_estate_projects table
CREATE TABLE public.real_estate_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  developer TEXT,
  price_range TEXT,
  surface_range TEXT,
  rooms_range TEXT,
  description TEXT,
  features TEXT[],
  amenities TEXT[],
  location_advantages TEXT[],
  investment_details TEXT,
  payment_plans TEXT[],
  completion_date TEXT,
  status TEXT DEFAULT 'available',
  main_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.real_estate_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to real_estate_projects"
  ON public.real_estate_projects
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert real_estate_projects"
  ON public.real_estate_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update real_estate_projects"
  ON public.real_estate_projects
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete real_estate_projects"
  ON public.real_estate_projects
  FOR DELETE
  TO authenticated
  USING (true);

-- Create catalog_offers table
CREATE TABLE public.catalog_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT,
  description TEXT,
  price_min INTEGER DEFAULT 0,
  price_max INTEGER DEFAULT 0,
  surface_min INTEGER DEFAULT 0,
  surface_max INTEGER DEFAULT 0,
  rooms INTEGER DEFAULT 1,
  available_units INTEGER DEFAULT 1,
  project_id UUID REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  project_name TEXT,
  source TEXT,
  images TEXT[],
  availability_status TEXT DEFAULT 'available',
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to catalog_offers"
  ON public.catalog_offers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert catalog_offers"
  ON public.catalog_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update catalog_offers"
  ON public.catalog_offers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete catalog_offers"
  ON public.catalog_offers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create business_cards table
CREATE TABLE public.business_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  function_title TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  qr_link TEXT,
  front_svg TEXT NOT NULL,
  back_svg TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to business_cards"
  ON public.business_cards
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'agent')
  );
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create complexes table
CREATE TABLE public.complexes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view complexes"
  ON public.complexes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert complexes"
  ON public.complexes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update complexes"
  ON public.complexes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete complexes"
  ON public.complexes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create user_complexes junction table
CREATE TABLE public.user_complexes (
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  complex_id UUID NOT NULL REFERENCES public.complexes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, complex_id)
);

ALTER TABLE public.user_complexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view user_complexes"
  ON public.user_complexes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert user_complexes"
  ON public.user_complexes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete user_complexes"
  ON public.user_complexes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_real_estate_projects_updated_at
  BEFORE UPDATE ON public.real_estate_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_offers_updated_at
  BEFORE UPDATE ON public.catalog_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for project images
CREATE POLICY "Public can view project images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can update project images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can delete project images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-images');