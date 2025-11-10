-- Fix security warnings

-- Move pg_net extension to extensions schema if not already there
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update notify_google_sitemap function with proper search_path
CREATE OR REPLACE FUNCTION public.notify_google_sitemap()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Make async HTTP request to notify-google-sitemap edge function
  PERFORM extensions.net.http_post(
    url := 'https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/notify-google-sitemap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object(
      'timestamp', now(),
      'source', 'database_trigger'
    )
  );
END;
$$;

-- Update trigger function with proper search_path
CREATE OR REPLACE FUNCTION public.trigger_google_sitemap_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Call the notification function asynchronously
  PERFORM public.notify_google_sitemap();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_google_sitemap() IS 'Notifies Google Search Console about sitemap updates via edge function';
COMMENT ON FUNCTION public.trigger_google_sitemap_notification() IS 'Trigger function that notifies Google when properties or complexes change';
