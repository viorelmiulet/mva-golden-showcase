
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text,
  author text NOT NULL DEFAULT 'MVA Imobiliare',
  category_id text NOT NULL DEFAULT 'ghiduri',
  category text NOT NULL DEFAULT 'Ghiduri',
  read_time text DEFAULT '5 min',
  featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  meta_title text,
  meta_description text,
  cover_image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

-- Authenticated users can manage posts (admin uses service role anyway)
CREATE POLICY "Authenticated users can insert blog posts" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update blog posts" ON public.blog_posts
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete blog posts" ON public.blog_posts
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view all blog posts" ON public.blog_posts
  FOR SELECT TO authenticated USING (true);
