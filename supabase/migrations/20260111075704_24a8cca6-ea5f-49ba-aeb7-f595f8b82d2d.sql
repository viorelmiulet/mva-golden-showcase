-- Create sent_emails table to store outgoing emails
CREATE TABLE public.sent_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  cc TEXT,
  bcc TEXT,
  subject TEXT,
  body_html TEXT,
  body_plain TEXT,
  from_address TEXT NOT NULL,
  message_id TEXT,
  in_reply_to TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- Create public policies (same as received_emails)
CREATE POLICY "Allow public read access to sent_emails"
  ON public.sent_emails
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to sent_emails"
  ON public.sent_emails
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to sent_emails"
  ON public.sent_emails
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to sent_emails"
  ON public.sent_emails
  FOR DELETE
  USING (true);