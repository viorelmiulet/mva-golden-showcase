-- Create table for received emails
CREATE TABLE public.received_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL,
  recipient TEXT,
  subject TEXT,
  body_plain TEXT,
  body_html TEXT,
  stripped_text TEXT,
  message_id TEXT,
  in_reply_to TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admins) to view all emails
CREATE POLICY "Authenticated users can view emails" 
ON public.received_emails 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy for authenticated users to update emails (mark as read, star, archive)
CREATE POLICY "Authenticated users can update emails" 
ON public.received_emails 
FOR UPDATE 
TO authenticated
USING (true);

-- Create policy for authenticated users to delete emails
CREATE POLICY "Authenticated users can delete emails" 
ON public.received_emails 
FOR DELETE 
TO authenticated
USING (true);

-- Create policy for service role to insert emails (from webhook)
CREATE POLICY "Service role can insert emails" 
ON public.received_emails 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_received_emails_received_at ON public.received_emails(received_at DESC);
CREATE INDEX idx_received_emails_is_read ON public.received_emails(is_read);
CREATE INDEX idx_received_emails_sender ON public.received_emails(sender);