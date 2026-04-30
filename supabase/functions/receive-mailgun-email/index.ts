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
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generate unique email ID for attachment paths
    const emailId = crypto.randomUUID();
    
    // Handle attachments
    const attachmentCount = parseInt(formData.get('attachment-count') as string || '0');
    const attachments: any[] = [];
    
    console.log(`Processing ${attachmentCount} attachments`);
    
    for (let i = 1; i <= attachmentCount; i++) {
      const attachment = formData.get(`attachment-${i}`);
      if (attachment instanceof File) {
        try {
          // Read file content
          const arrayBuffer = await attachment.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Generate unique filename
          const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `${emailId}/${sanitizedName}`;
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('email-attachments')
            .upload(filePath, uint8Array, {
              contentType: attachment.type,
              upsert: true
            });
          
          if (uploadError) {
            console.error(`Error uploading attachment ${attachment.name}:`, uploadError);
            // Still add metadata even if upload fails
            attachments.push({
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              url: null,
              path: null,
              bucket: 'email-attachments',
              error: uploadError.message
            });
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('email-attachments')
              .getPublicUrl(filePath);
            
            console.log(`Uploaded attachment: ${attachment.name} -> ${urlData.publicUrl}`);
            
            attachments.push({
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              url: urlData.publicUrl,
              path: filePath,
              bucket: 'email-attachments'
            });
          }
        } catch (attachError) {
          console.error(`Error processing attachment ${attachment.name}:`, attachError);
          attachments.push({
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            url: null,
            path: null,
            bucket: 'email-attachments',
            error: String(attachError)
          });
        }
      }
    }
    
    console.log('Email data:', { sender, recipient, subject, attachmentCount, attachments: attachments.length });
    
    // Calculate received_at from timestamp or use now
    const receivedAt = timestamp 
      ? new Date(parseInt(timestamp) * 1000).toISOString() 
      : new Date().toISOString();
    
    // Insert email into database
    const { data, error } = await supabase
      .from('received_emails')
      .insert({
        id: emailId,
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
