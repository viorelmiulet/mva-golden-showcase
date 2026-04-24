DROP POLICY IF EXISTS "Authenticated users can view preset items" ON public.preset_inventory_items;
CREATE POLICY "Anyone can view preset items"
ON public.preset_inventory_items
FOR SELECT
USING (true);