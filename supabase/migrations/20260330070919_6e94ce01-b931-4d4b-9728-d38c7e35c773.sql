
CREATE POLICY "Anon can update received_emails"
ON public.received_emails
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can delete received_emails"
ON public.received_emails
FOR DELETE
TO anon
USING (true);

CREATE POLICY "Anon can update sent_emails"
ON public.sent_emails
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can delete sent_emails"
ON public.sent_emails
FOR DELETE
TO anon
USING (true);
