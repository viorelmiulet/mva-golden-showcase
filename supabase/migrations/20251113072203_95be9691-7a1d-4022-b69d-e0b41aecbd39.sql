-- Add explicit deny-all RLS policy for clarity
CREATE POLICY "deny_all_access"
ON public.sitemap_notifications
FOR ALL
USING (false)
WITH CHECK (false);