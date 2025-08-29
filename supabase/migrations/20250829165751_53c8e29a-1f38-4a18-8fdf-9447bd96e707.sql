-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the Storia offers update to run every hour
SELECT cron.schedule(
  'update-storia-offers-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/update-storia-offers',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2JxZXljdmlxY2t6anlva3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDk1NjgsImV4cCI6MjA3MTk4NTU2OH0.FcSHvGjPEkUVKtPvjQqlwErNdizEPX2YeBFc20O4dnE"}'::jsonb,
        body:='{"scheduled": true, "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);