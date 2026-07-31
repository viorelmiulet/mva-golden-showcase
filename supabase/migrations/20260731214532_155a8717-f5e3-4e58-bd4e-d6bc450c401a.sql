
-- ensure unique email
CREATE UNIQUE INDEX IF NOT EXISTS email_contacts_email_key ON public.email_contacts (lower(email));

CREATE OR REPLACE FUNCTION public.upsert_email_contact(_raw text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  part text;
  addr text;
  nm text;
BEGIN
  IF _raw IS NULL OR btrim(_raw) = '' THEN RETURN; END IF;

  FOREACH part IN ARRAY regexp_split_to_array(_raw, '\s*[,;]\s*') LOOP
    IF part IS NULL OR btrim(part) = '' THEN CONTINUE; END IF;

    IF part ~ '<' THEN
      addr := lower(btrim((regexp_match(part, '<([^>]+)>'))[1]));
      nm := nullif(btrim(btrim(split_part(part, '<', 1)), '" '), '');
    ELSE
      addr := lower(btrim(part));
      nm := NULL;
    END IF;

    IF addr IS NULL OR addr !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN CONTINUE; END IF;

    INSERT INTO public.email_contacts (email, name, last_used_at, use_count)
    VALUES (addr, nm, now(), 1)
    ON CONFLICT (lower(email)) DO UPDATE
      SET last_used_at = now(),
          use_count = public.email_contacts.use_count + 1,
          name = COALESCE(public.email_contacts.name, EXCLUDED.name);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_email_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'sent_emails' THEN
    PERFORM public.upsert_email_contact(NEW.recipient);
    PERFORM public.upsert_email_contact(NEW.cc);
    PERFORM public.upsert_email_contact(NEW.bcc);
  ELSIF TG_TABLE_NAME = 'received_emails' THEN
    PERFORM public.upsert_email_contact(NEW.sender);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_contacts_sent ON public.sent_emails;
CREATE TRIGGER trg_track_contacts_sent
AFTER INSERT ON public.sent_emails
FOR EACH ROW EXECUTE FUNCTION public.track_email_contacts();

DROP TRIGGER IF EXISTS trg_track_contacts_received ON public.received_emails;
CREATE TRIGGER trg_track_contacts_received
AFTER INSERT ON public.received_emails
FOR EACH ROW EXECUTE FUNCTION public.track_email_contacts();
