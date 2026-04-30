import { sendMailgunEmail } from '../_shared/mailgun.ts';
import { getFromAddressForFunction } from '../_shared/emailSettings.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
}

interface ReplyEmailRequest {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  originalEmailId?: string;
  attachments?: EmailAttachment[];
  isReply?: boolean; // true = reply to existing email, false = new compose
  replyFromAddress?: string; // the recipient address from the original email
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, bcc, subject, body, inReplyTo, attachments, isReply, replyFromAddress }: ReplyEmailRequest = await req.json();

    if (!to || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending email to:', to, 'with', attachments?.length || 0, 'attachments');
    console.log('Is reply:', isReply, 'Reply from address:', replyFromAddress);

    // Determine the from address:
    // - If it's a reply AND we have the original recipient address, use that
    // - Otherwise, use contact@mvaimobiliare.ro for new emails
    let fromAddress: string;
    
    if (isReply && replyFromAddress) {
      // Extract just the email if it's in format "Name <email>"
      const emailMatch = replyFromAddress.match(/<([^>]+)>/);
      fromAddress = `MVA Imobiliare <${emailMatch ? emailMatch[1] : replyFromAddress}>`;
      console.log('Reply mode - using original recipient address:', fromAddress);
    } else {
      // New email - always use contact address
      fromAddress = await getFromAddressForFunction('contact');
      console.log('Compose mode - using contact address:', fromAddress);
    }

    // Build custom headers for threading
    const customHeaders: Record<string, string> = {};
    if (inReplyTo) {
      customHeaders['In-Reply-To'] = inReplyTo;
      customHeaders['References'] = inReplyTo;
    }

    // Check if body is already HTML (from rich text editor)
    const isHtml = body.trim().startsWith('<');
    const bodyHtml = isHtml 
      ? body 
      : body.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line || '&nbsp;'}</p>`).join('');

    const fullHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        ${bodyHtml}
        <br/>
        <p style="color: #666; font-size: 12px;">
          —<br/>
          MVA Imobiliare<br/>
          <a href="https://mvaimobiliare.ro" style="color: #C6A052;">mvaimobiliare.ro</a>
        </p>
      </div>
    `;

    const result = await sendMailgunEmail({
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject || '(Fără subiect)',
      from: fromAddress,
      html: fullHtml,
      customHeaders,
      attachments: attachments || [],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    console.log('Email sent successfully, saving to sent_emails...');

    // Save sent email to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Upload attachments to storage so they remain visible/downloadable from the inbox UI
      const sentEmailId = crypto.randomUUID();
      const storedAttachments: any[] = [];

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          try {
            if (!att.content || !att.filename) continue;

            // Strip data URL prefix if present and decode base64 -> bytes
            let base64Content = att.content;
            if (base64Content.includes(',')) base64Content = base64Content.split(',')[1];
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

            const sanitizedName = att.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${sentEmailId}/${sanitizedName}`;

            const { error: upErr } = await supabase.storage
              .from('email-attachments')
              .upload(filePath, bytes, {
                contentType: att.contentType || 'application/octet-stream',
                upsert: true,
              });

            if (upErr) {
              console.error(`Sent attachment upload failed (${att.filename}):`, upErr);
              storedAttachments.push({
                name: att.filename,
                size: bytes.length,
                type: att.contentType || 'application/octet-stream',
                url: null,
                path: null,
                bucket: 'email-attachments',
              });
              continue;
            }

            const { data: urlData } = supabase.storage
              .from('email-attachments')
              .getPublicUrl(filePath);

            storedAttachments.push({
              name: att.filename,
              size: bytes.length,
              type: att.contentType || 'application/octet-stream',
              url: urlData.publicUrl,
              path: filePath,
              bucket: 'email-attachments',
            });
          } catch (e) {
            console.error('Error storing sent attachment:', e);
          }
        }
      }

      const { error: insertError } = await supabase
        .from('sent_emails')
        .insert({
          id: sentEmailId,
          recipient: to,
          cc: cc || null,
          bcc: bcc || null,
          subject: subject || '(Fără subiect)',
          body_html: fullHtml,
          body_plain: body,
          from_address: fromAddress,
          message_id: result.messageId || null,
          in_reply_to: inReplyTo || null,
          attachments: storedAttachments,
          sent_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error saving sent email:', insertError);
      } else {
        console.log('Sent email saved to database');
      }
    } catch (saveError) {
      console.error('Error saving sent email:', saveError);
      // Don't fail the request if saving fails
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
