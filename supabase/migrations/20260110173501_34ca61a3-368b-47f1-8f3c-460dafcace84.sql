-- Drop the incorrectly configured insert policy
DROP POLICY IF EXISTS "Service role can insert emails" ON received_emails;

-- Create insert policy that allows inserts (will be done by service role via edge function)
-- The edge function uses service_role key which bypasses RLS anyway
-- But we add this for completeness
CREATE POLICY "Allow insert emails" ON received_emails
FOR INSERT WITH CHECK (true);