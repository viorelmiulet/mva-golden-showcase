import { sendMailgunEmail } from '../_shared/mailgun.ts';
import { getFromAddressForFunction } from '../_shared/emailSettings.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailAttachment {
  filename: string;
  contentType: string;
  // EITHER inline base64 content (small files)
  content?: string;
  // OR a pre-uploaded file in Supabase Storage (large files)
  path?: string;        // path inside the bucket
  bucket?: string;      // defaults to "email-attachments"
  url?: string;         // optional public URL to reuse
  size?: number;        // optional size hint
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
    const diagnostics: {
      requestedAttachments: number;
      uploaded: Array<{ name: string; size: number; path: string }>;
      failed: Array<{ name: string; reason: string }>;
      skipped: Array<{ name?: string; reason: string }>;
      dbInsert: 'ok' | 'error' | 'skipped';
      dbError?: string;
    } = {
      requestedAttachments: attachments?.length || 0,
      uploaded: [],
      failed: [],
      skipped: [],
      dbInsert: 'skipped',
    };

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Upload attachments to storage so they remain visible/downloadable from the inbox UI
      const sentEmailId = crypto.randomUUID();
      const storedAttachments: any[] = [];

      console.log(`[reply-email] Processing ${diagnostics.requestedAttachments} attachment(s) for sent_email ${sentEmailId}`);

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          try {
            if (!att.content || !att.filename) {
              console.warn(`[reply-email] Skipping attachment - missing content/filename:`, { filename: att?.filename, hasContent: !!att?.content });
              diagnostics.skipped.push({ name: att?.filename, reason: 'missing content or filename' });
              continue;
            }

            // Strip data URL prefix if present and decode base64 -> bytes
            let base64Content = att.content;
            if (base64Content.includes(',')) base64Content = base64Content.split(',')[1];
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

            const sanitizedName = att.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `${sentEmailId}/${sanitizedName}`;

            console.log(`[reply-email] Uploading "${att.filename}" (${bytes.length} bytes) -> ${filePath}`);

            const { error: upErr } = await supabase.storage
              .from('email-attachments')
              .upload(filePath, bytes, {
                contentType: att.contentType || 'application/octet-stream',
                upsert: true,
              });

            if (upErr) {
              console.error(`[reply-email] Upload FAILED for "${att.filename}":`, upErr);
              diagnostics.failed.push({ name: att.filename, reason: upErr.message || String(upErr) });
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

            console.log(`[reply-email] Upload OK "${att.filename}" -> ${urlData.publicUrl}`);
            diagnostics.uploaded.push({ name: att.filename, size: bytes.length, path: filePath });

            storedAttachments.push({
              name: att.filename,
              size: bytes.length,
              type: att.contentType || 'application/octet-stream',
              url: urlData.publicUrl,
              path: filePath,
              bucket: 'email-attachments',
            });
          } catch (e) {
            console.error(`[reply-email] Exception while storing attachment "${att?.filename}":`, e);
            diagnostics.failed.push({ name: att?.filename || 'unknown', reason: String(e) });
          }
        }
      }

      console.log(`[reply-email] Attachment summary:`, {
        requested: diagnostics.requestedAttachments,
        uploaded: diagnostics.uploaded.length,
        failed: diagnostics.failed.length,
        skipped: diagnostics.skipped.length,
      });

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
        console.error('[reply-email] DB insert FAILED:', insertError);
        diagnostics.dbInsert = 'error';
        diagnostics.dbError = insertError.message;
      } else {
        console.log(`[reply-email] sent_emails row ${sentEmailId} inserted with ${storedAttachments.length} attachment metadata entries`);
        diagnostics.dbInsert = 'ok';
      }
    } catch (saveError) {
      console.error('[reply-email] Unexpected error saving sent email:', saveError);
      diagnostics.dbInsert = 'error';
      diagnostics.dbError = String(saveError);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId, diagnostics }),
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
