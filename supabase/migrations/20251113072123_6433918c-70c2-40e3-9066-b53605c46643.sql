-- Create a queue table to avoid HTTP from inside the database
CREATE TABLE IF NOT EXISTS public.sitemap_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT,
  metadata JSONB
);

-- Replace notification function to enqueue instead of HTTP POST
CREATE OR REPLACE FUNCTION public.notify_google_sitemap()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.sitemap_notifications (source, metadata)
  VALUES ('database_trigger', jsonb_build_object(
    'timestamp', now()
  ));
END;
$$;

-- Ensure the trigger wrapper still calls notify function (kept unchanged signature)
CREATE OR REPLACE FUNCTION public.trigger_google_sitemap_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.notify_google_sitemap();
  RETURN NEW;
END;
$$;