INSERT INTO public.site_settings (key, value)
VALUES ('integration_homedirect_api_key', 'd05bbd0f7def54431adf628b8ebe1f60c5ba82e7faa389a82a1477289a8f0aa9')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;