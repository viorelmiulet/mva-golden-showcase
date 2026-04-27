
-- Update the trigger function to also handle news_articles
CREATE OR REPLACE FUNCTION public.trigger_google_sitemap_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_url constant text := 'https://mvaimobiliare.ro';
  target_urls jsonb := jsonb_build_array(
    base_url,
    base_url || '/proprietati',
    base_url || '/complexe',
    base_url || '/blog'
  );
  property_slug text;
  should_notify boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'catalog_offers' THEN
    IF TG_OP = 'INSERT' THEN
      should_notify := coalesce(NEW.is_published, false) = true
        AND coalesce(NEW.availability_status, 'available') = 'available';
    ELSIF TG_OP = 'UPDATE' THEN
      should_notify := (
        coalesce(NEW.is_published, false) = true
        AND coalesce(NEW.availability_status, 'available') = 'available'
        AND (
          coalesce(OLD.is_published, false) IS DISTINCT FROM coalesce(NEW.is_published, false)
          OR coalesce(OLD.availability_status, 'available') IS DISTINCT FROM coalesce(NEW.availability_status, 'available')
        )
      );
    END IF;

    IF should_notify THEN
      property_slug := public.generate_property_slug_db(
        NEW.id,
        NEW.rooms,
        NEW.project_name,
        NEW.zone,
        NEW.location,
        NEW.surface_min,
        NEW.floor,
        NEW.city
      );

      target_urls := target_urls || jsonb_build_array(
        base_url || '/proprietati/' || property_slug
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'blog_posts' THEN
    IF coalesce(NEW.is_published, false) = true AND coalesce(NEW.slug, '') <> '' THEN
      IF TG_OP = 'INSERT' THEN
        should_notify := true;
      ELSIF TG_OP = 'UPDATE' THEN
        should_notify := (
          coalesce(OLD.updated_at, now()) IS DISTINCT FROM coalesce(NEW.updated_at, now())
          OR coalesce(OLD.slug, '') IS DISTINCT FROM coalesce(NEW.slug, '')
          OR coalesce(OLD.is_published, false) IS DISTINCT FROM coalesce(NEW.is_published, false)
          OR coalesce(OLD.title, '') IS DISTINCT FROM coalesce(NEW.title, '')
          OR coalesce(OLD.content, '') IS DISTINCT FROM coalesce(NEW.content, '')
        );
      END IF;

      IF should_notify THEN
        target_urls := target_urls || jsonb_build_array(
          base_url || '/blog/' || NEW.slug
        );
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'news_articles' THEN
    IF coalesce(NEW.status, '') = 'published' AND coalesce(NEW.slug, '') <> '' THEN
      IF TG_OP = 'INSERT' THEN
        should_notify := true;
      ELSIF TG_OP = 'UPDATE' THEN
        should_notify := (
          coalesce(OLD.status, '') IS DISTINCT FROM coalesce(NEW.status, '')
          OR coalesce(OLD.slug, '') IS DISTINCT FROM coalesce(NEW.slug, '')
          OR coalesce(OLD.title, '') IS DISTINCT FROM coalesce(NEW.title, '')
          OR coalesce(OLD.content, '') IS DISTINCT FROM coalesce(NEW.content, '')
          OR coalesce(OLD.updated_at, now()) IS DISTINCT FROM coalesce(NEW.updated_at, now())
        );
      END IF;

      IF should_notify THEN
        target_urls := target_urls || jsonb_build_array(
          base_url || '/news',
          base_url || '/news/' || NEW.slug,
          base_url || '/news-sitemap.xml'
        );
      END IF;
    END IF;
  END IF;

  IF should_notify THEN
    PERFORM public.notify_google_sitemap(target_urls);
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on news_articles
DROP TRIGGER IF EXISTS trigger_news_articles_sitemap_notification ON public.news_articles;
CREATE TRIGGER trigger_news_articles_sitemap_notification
AFTER INSERT OR UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_google_sitemap_notification();
