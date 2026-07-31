
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
    ON CONFLICT (email) DO UPDATE
      SET last_used_at = now(),
          use_count = public.email_contacts.use_count + 1,
          name = COALESCE(public.email_contacts.name, EXCLUDED.name);
  END LOOP;
END;
$$;
