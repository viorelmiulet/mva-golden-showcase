CREATE POLICY "Anon can insert fb queue" ON public.fb_post_queue FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can view fb queue" ON public.fb_post_queue FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can update fb queue" ON public.fb_post_queue FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete fb queue" ON public.fb_post_queue FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_post_queue TO anon;