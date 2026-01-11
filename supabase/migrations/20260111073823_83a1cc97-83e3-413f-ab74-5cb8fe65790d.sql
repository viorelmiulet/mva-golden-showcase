-- Add RLS policies for email_contacts table
-- Allow authenticated users to view all email contacts
CREATE POLICY "Authenticated users can view email contacts"
ON public.email_contacts
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert email contacts
CREATE POLICY "Authenticated users can insert email contacts"
ON public.email_contacts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update email contacts
CREATE POLICY "Authenticated users can update email contacts"
ON public.email_contacts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete email contacts
CREATE POLICY "Authenticated users can delete email contacts"
ON public.email_contacts
FOR DELETE
TO authenticated
USING (true);