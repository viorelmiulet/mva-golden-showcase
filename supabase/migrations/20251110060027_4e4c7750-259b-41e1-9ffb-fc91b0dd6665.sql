-- Enable pg_net extension for making HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to notify Google about sitemap updates
CREATE OR REPLACE FUNCTION public.notify_google_sitemap()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Make async HTTP request to notify-google-sitemap edge function
  PERFORM net.http_post(
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

-- Create trigger function that calls the notification
CREATE OR REPLACE FUNCTION public.trigger_google_sitemap_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the notification function asynchronously
  PERFORM public.notify_google_sitemap();
  RETURN NEW;
END;
$$;

-- Create trigger for real_estate_projects table
DROP TRIGGER IF EXISTS notify_google_on_project_change ON public.real_estate_projects;
CREATE TRIGGER notify_google_on_project_change
  AFTER INSERT OR UPDATE ON public.real_estate_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_sitemap_notification();

-- Create trigger for catalog_offers table
DROP TRIGGER IF EXISTS notify_google_on_offer_change ON public.catalog_offers;
CREATE TRIGGER notify_google_on_offer_change
  AFTER INSERT OR UPDATE ON public.catalog_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_sitemap_notification();

COMMENT ON FUNCTION public.notify_google_sitemap() IS 'Notifies Google Search Console about sitemap updates via edge function';
COMMENT ON FUNCTION public.trigger_google_sitemap_notification() IS 'Trigger function that notifies Google when properties or complexes change';
