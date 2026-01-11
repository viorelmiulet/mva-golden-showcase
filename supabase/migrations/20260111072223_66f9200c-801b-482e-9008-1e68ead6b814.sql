-- Create a table to store email contacts for autocomplete suggestions
CREATE TABLE public.email_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  use_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies - admins can manage contacts
CREATE POLICY "Admins can view email contacts"
ON public.email_contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'agent')
  )
);

CREATE POLICY "Admins can insert email contacts"
ON public.email_contacts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'agent')
  )
);

CREATE POLICY "Admins can update email contacts"
ON public.email_contacts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'agent')
  )
);

-- Create index for faster email lookups
CREATE INDEX idx_email_contacts_email ON public.email_contacts USING btree (email);
CREATE INDEX idx_email_contacts_last_used ON public.email_contacts USING btree (last_used_at DESC);

-- Populate with existing email addresses from received_emails
INSERT INTO public.email_contacts (email, name, last_used_at, use_count)
SELECT DISTINCT 
  LOWER(TRIM(sender)) as email,
  CASE 
    WHEN sender LIKE '%<%>%' THEN TRIM(SPLIT_PART(sender, '<', 1))
    ELSE NULL
  END as name,
  MAX(received_at) as last_used_at,
  COUNT(*) as use_count
FROM public.received_emails
WHERE sender IS NOT NULL AND sender != ''
GROUP BY LOWER(TRIM(sender)), 
  CASE 
    WHEN sender LIKE '%<%>%' THEN TRIM(SPLIT_PART(sender, '<', 1))
    ELSE NULL
  END
ON CONFLICT (email) DO UPDATE SET
  use_count = email_contacts.use_count + EXCLUDED.use_count,
  last_used_at = GREATEST(email_contacts.last_used_at, EXCLUDED.last_used_at);