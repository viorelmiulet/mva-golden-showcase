import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received Mailgun webhook');
    
    // Mailgun sends form data
    const formData = await req.formData();
    
    // Extract email data from form
    const sender = formData.get('sender') as string || formData.get('from') as string || '';
    const recipient = formData.get('recipient') as string || formData.get('To') as string || '';
    const subject = formData.get('subject') as string || '(Fără subiect)';
    const bodyPlain = formData.get('body-plain') as string || '';
    const bodyHtml = formData.get('body-html') as string || '';
    const strippedText = formData.get('stripped-text') as string || '';
    const messageId = formData.get('Message-Id') as string || '';
    const inReplyTo = formData.get('In-Reply-To') as string || '';
    const timestamp = formData.get('timestamp') as string;
    
    // Handle attachments
    const attachmentCount = parseInt(formData.get('attachment-count') as string || '0');
    const attachments: any[] = [];
    
    for (let i = 1; i <= attachmentCount; i++) {
      const attachment = formData.get(`attachment-${i}`);
      if (attachment instanceof File) {
        attachments.push({
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
        });
      }
    }
    
    console.log('Email data:', { sender, recipient, subject, attachmentCount });
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Calculate received_at from timestamp or use now
    const receivedAt = timestamp 
      ? new Date(parseInt(timestamp) * 1000).toISOString() 
      : new Date().toISOString();
    
    // Insert email into database
    const { data, error } = await supabase
      .from('received_emails')
      .insert({
        sender,
        recipient,
        subject,
        body_plain: bodyPlain,
        body_html: bodyHtml,
        stripped_text: strippedText,
        message_id: messageId,
        in_reply_to: inReplyTo,
        attachments,
        received_at: receivedAt,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting email:', error);
      throw error;
    }
    
    console.log('Email saved successfully:', data.id);
    
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Error processing Mailgun webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
