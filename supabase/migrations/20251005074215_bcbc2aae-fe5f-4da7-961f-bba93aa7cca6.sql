-- Fix RLS policies for business_cards table to allow public access
-- The current policies have misleading names - they say "authenticated users only" 
-- but the condition is true, allowing anyone. However, the DELETE policy is blocking.

-- Drop existing policies
DROP POLICY IF EXISTS "Only authenticated users can delete business cards" ON business_cards;
DROP POLICY IF EXISTS "Only authenticated users can insert business cards" ON business_cards;
DROP POLICY IF EXISTS "Only authenticated users can update business cards" ON business_cards;
DROP POLICY IF EXISTS "Anyone can view business cards" ON business_cards;

-- Create new policies with correct names and conditions for public access
CREATE POLICY "Anyone can view business cards"
  ON business_cards
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert business cards"
  ON business_cards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update business cards"
  ON business_cards
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete business cards"
  ON business_cards
  FOR DELETE
  USING (true);