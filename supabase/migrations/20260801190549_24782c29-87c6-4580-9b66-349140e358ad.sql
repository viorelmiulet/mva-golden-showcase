INSERT INTO public.app_runtime_config (key, value)
VALUES ('FB_QUEUE_API_KEY', 'ace08e3af682dc93dc8799254aa54ad295ed7d272db056a8')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;