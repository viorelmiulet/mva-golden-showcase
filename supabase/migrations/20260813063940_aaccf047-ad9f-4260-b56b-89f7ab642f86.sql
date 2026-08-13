-- 1. Remove every anon-writable policy (the publishable key is public).
DROP POLICY IF EXISTS "Anyone can insert signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Anyone can update signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "Anon can update contract signing status" ON public.contracts;
DROP POLICY IF EXISTS "Allow anon insert events" ON public.events;
DROP POLICY IF EXISTS "Anon can delete fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Anon can insert fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Anon can update fb groups" ON public.fb_groups;
DROP POLICY IF EXISTS "Anon can delete fb queue" ON public.fb_post_queue;
DROP POLICY IF EXISTS "Anon can insert fb queue" ON public.fb_post_queue;
DROP POLICY IF EXISTS "Anon can update fb queue" ON public.fb_post_queue;
DROP POLICY IF EXISTS "fb_queue_state_insert" ON public.fb_queue_state;
DROP POLICY IF EXISTS "fb_queue_state_write" ON public.fb_queue_state;
DROP POLICY IF EXISTS "Allow anon insert page_views" ON public.page_views;
DROP POLICY IF EXISTS "Anon can delete received_emails" ON public.received_emails;
DROP POLICY IF EXISTS "Anon can update received_emails" ON public.received_emails;
DROP POLICY IF EXISTS "Anon can delete sent_emails" ON public.sent_emails;
DROP POLICY IF EXISTS "Anon can update sent_emails" ON public.sent_emails;
DROP POLICY IF EXISTS "Anon can delete facebook_groups setting" ON public.site_settings;
DROP POLICY IF EXISTS "Anon can insert facebook_groups setting" ON public.site_settings;
DROP POLICY IF EXISTS "Anon can update facebook_groups setting" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.viewing_appointments;

-- 2. Revoke leftover anon write grants on those tables.
REVOKE INSERT, UPDATE, DELETE ON public.contract_signatures FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.contracts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.page_views FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fb_groups FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fb_post_queue FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.fb_queue_state FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.received_emails FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.sent_emails FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.site_settings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.viewing_appointments FROM anon;

-- 3. Store the admin password server-side (service role only table).
INSERT INTO public.app_runtime_config (key, value, updated_at)
VALUES ('ADMIN_PASSWORD', '123456', now())
ON CONFLICT (key) DO NOTHING;