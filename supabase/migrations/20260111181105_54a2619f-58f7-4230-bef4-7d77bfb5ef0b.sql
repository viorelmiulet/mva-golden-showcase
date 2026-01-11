-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the scheduled-social-post edge function
CREATE OR REPLACE FUNCTION public.trigger_scheduled_social_post()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_value text;
  settings_json jsonb;
  schedule_interval text;
  is_scheduled boolean;
BEGIN
  -- Get the webhook settings
  SELECT value INTO settings_value
  FROM site_settings
  WHERE key = 'social_webhooks';
  
  IF settings_value IS NULL THEN
    RETURN;
  END IF;
  
  settings_json := settings_value::jsonb;
  is_scheduled := COALESCE((settings_json->>'scheduled')::boolean, false);
  
  IF NOT is_scheduled THEN
    RETURN;
  END IF;
  
  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/scheduled-social-post',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the cron job to run every hour (the function will check settings to decide if it should actually post)
SELECT cron.schedule(
  'scheduled-social-post-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT public.trigger_scheduled_social_post()$$
);