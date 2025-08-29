-- Create table for chat conversations
CREATE TABLE public.chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (so the chat can save conversations)
CREATE POLICY "Anyone can insert chat conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (true);

-- Create policy for authenticated users to view all conversations (admin access)
CREATE POLICY "Authenticated users can view all conversations"
ON public.chat_conversations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX idx_chat_conversations_session_id ON public.chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_timestamp ON public.chat_conversations(timestamp DESC);

-- Create function to get conversations summary
CREATE OR REPLACE FUNCTION public.get_conversations_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  session_id TEXT,
  conversation_start TIMESTAMP WITH TIME ZONE,
  message_count BIGINT,
  first_user_message TEXT,
  client_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.session_id,
    MIN(cc.timestamp) as conversation_start,
    COUNT(*) as message_count,
    (SELECT message FROM public.chat_conversations 
     WHERE session_id = cc.session_id AND role = 'user' 
     ORDER BY timestamp ASC LIMIT 1) as first_user_message,
    (SELECT client_info FROM public.chat_conversations 
     WHERE session_id = cc.session_id AND client_info IS NOT NULL 
     ORDER BY timestamp ASC LIMIT 1) as client_info
  FROM public.chat_conversations cc
  WHERE cc.timestamp::DATE BETWEEN start_date AND end_date
  GROUP BY cc.session_id
  ORDER BY conversation_start DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;