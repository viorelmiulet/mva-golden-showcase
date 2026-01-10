import { sendMailgunEmail } from '../_shared/mailgun.ts';

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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, bcc, subject, body, inReplyTo, attachments }: ReplyEmailRequest = await req.json();

    if (!to || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending email to:', to, 'with', attachments?.length || 0, 'attachments');

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
