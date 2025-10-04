-- Drop existing overly permissive policies on business_cards
DROP POLICY IF EXISTS "Anyone can insert business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Anyone can update business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Anyone can delete business cards" ON public.business_cards;

-- Keep public read access (for displaying on website)
-- This policy already exists: "Anyone can view business cards"

-- Restrict INSERT to authenticated users only
CREATE POLICY "Only authenticated users can insert business cards"
ON public.business_cards
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Restrict UPDATE to authenticated users only
CREATE POLICY "Only authenticated users can update business cards"
ON public.business_cards
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Restrict DELETE to authenticated users only
CREATE POLICY "Only authenticated users can delete business cards"
ON public.business_cards
FOR DELETE
TO authenticated
USING (true);

-- Add comment to document the security policy
COMMENT ON TABLE public.business_cards IS 'Contains employee contact information. Public read access for website display, but write operations restricted to authenticated users only to prevent spam harvesting and unauthorized modifications.';