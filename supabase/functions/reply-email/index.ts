import { sendMailgunEmail } from '../_shared/mailgun.ts';
import { getFromAddressForFunction } from '../_shared/emailSettings.ts';

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

    const result = await sendMailgunEmail({
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject || '(Fără subiect)',
      from: fromAddress,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          ${bodyHtml}
          <br/>
          <p style="color: #666; font-size: 12px;">
            —<br/>
            MVA Imobiliare<br/>
            <a href="https://mvaimobiliare.ro" style="color: #C6A052;">mvaimobiliare.ro</a>
          </p>
        </div>
      `,
      customHeaders,
      attachments: attachments || [],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    console.log('Email sent successfully');

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
