-- Trigger to auto-notify search engines when a new property is added
CREATE TRIGGER notify_sitemap_on_new_property
  AFTER INSERT ON public.catalog_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_google_sitemap_notification();
