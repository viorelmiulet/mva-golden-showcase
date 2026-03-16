
-- Allow anon to read page_views for dashboard
CREATE POLICY "Allow anon read page_views"
  ON public.page_views FOR SELECT
  TO anon
  USING (true);

-- Allow anon to read events for dashboard  
CREATE POLICY "Allow anon read events"
  ON public.events FOR SELECT
  TO anon
  USING (true);
