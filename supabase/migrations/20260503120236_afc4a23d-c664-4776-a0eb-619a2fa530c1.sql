
CREATE OR REPLACE FUNCTION public.truncate_news_seo_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cut_pos INT;
BEGIN
  IF NEW.title IS NOT NULL AND length(NEW.title) > 80 THEN
    cut_pos := position(' ' in reverse(substring(NEW.title from 1 for 80)));
    IF cut_pos > 0 AND cut_pos < 25 THEN
      NEW.title := rtrim(substring(NEW.title from 1 for 80 - cut_pos), ' ,;:-');
    ELSE
      NEW.title := rtrim(substring(NEW.title from 1 for 80), ' ,;:-');
    END IF;
  END IF;

  IF NEW.description IS NOT NULL AND length(NEW.description) > 160 THEN
    cut_pos := position(' ' in reverse(substring(NEW.description from 1 for 160)));
    IF cut_pos > 0 AND cut_pos < 30 THEN
      NEW.description := rtrim(substring(NEW.description from 1 for 160 - cut_pos), ' ,;:-') || '…';
    ELSE
      NEW.description := rtrim(substring(NEW.description from 1 for 159), ' ,;:-') || '…';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_truncate_news_seo_fields ON public.news_articles;
CREATE TRIGGER trg_truncate_news_seo_fields
BEFORE INSERT OR UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.truncate_news_seo_fields();
