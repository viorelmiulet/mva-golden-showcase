GRANT INSERT, UPDATE, DELETE ON public.site_settings TO anon;

CREATE POLICY "Anon can insert facebook_groups setting"
ON public.site_settings FOR INSERT TO anon
WITH CHECK (key = 'facebook_groups');

CREATE POLICY "Anon can update facebook_groups setting"
ON public.site_settings FOR UPDATE TO anon
USING (key = 'facebook_groups')
WITH CHECK (key = 'facebook_groups');

CREATE POLICY "Anon can delete facebook_groups setting"
ON public.site_settings FOR DELETE TO anon
USING (key = 'facebook_groups');