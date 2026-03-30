
CREATE POLICY "Anon can view received_emails"
ON public.received_emails
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can view sent_emails"
ON public.sent_emails
FOR SELECT
TO anon
USING (true);
