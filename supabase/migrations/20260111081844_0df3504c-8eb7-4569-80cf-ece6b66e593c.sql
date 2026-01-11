-- Add is_deleted column to received_emails table
ALTER TABLE public.received_emails 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Add is_deleted column to sent_emails table
ALTER TABLE public.sent_emails 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Create index for faster queries on deleted emails
CREATE INDEX IF NOT EXISTS idx_received_emails_is_deleted ON public.received_emails(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sent_emails_is_deleted ON public.sent_emails(is_deleted);