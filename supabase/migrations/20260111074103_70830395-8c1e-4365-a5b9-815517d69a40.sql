-- Drop existing policies on email_contacts
DROP POLICY IF EXISTS "Authenticated users can view email contacts" ON public.email_contacts;
DROP POLICY IF EXISTS "Authenticated users can insert email contacts" ON public.email_contacts;
DROP POLICY IF EXISTS "Authenticated users can update email contacts" ON public.email_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete email contacts" ON public.email_contacts;
DROP POLICY IF EXISTS "Admins can view email contacts" ON public.email_contacts;
DROP POLICY IF EXISTS "Admins can insert email contacts" ON public.email_contacts;
DROP POLICY IF EXISTS "Admins can update email contacts" ON public.email_contacts;

-- Create new public policies (same as received_emails)
CREATE POLICY "Anyone can view email contacts"
ON public.email_contacts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert email contacts"
ON public.email_contacts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update email contacts"
ON public.email_contacts
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete email contacts"
ON public.email_contacts
FOR DELETE
USING (true);