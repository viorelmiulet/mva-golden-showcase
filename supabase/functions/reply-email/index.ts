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

    // ---- Normalize attachments: download pre-uploaded ones from Storage so Mailgun gets bytes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bytesToBase64 = (bytes: Uint8Array): string => {
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    };

    const normalizedForMailgun: Array<{ filename: string; content: string; contentType: string }> = [];
    // Keep Storage metadata (path/url/size) for sent_emails persistence
    const storageMeta: Record<string, { path?: string; url?: string; bucket?: string; size?: number }> = {};

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (!att.filename) continue;
        const bucket = att.bucket || 'email-attachments';
        try {
          if (att.content) {
            // Inline base64 — already good for Mailgun
            normalizedForMailgun.push({
              filename: att.filename,
              content: att.content,
              contentType: att.contentType || 'application/octet-stream',
            });
          } else if (att.path) {
            console.log(`[reply-email] Fetching pre-uploaded attachment "${att.filename}" from ${bucket}/${att.path}`);
            const { data: fileData, error: dlErr } = await supabase.storage
              .from(bucket)
              .download(att.path);
            if (dlErr || !fileData) {
              console.error(`[reply-email] Failed to download pre-uploaded attachment "${att.filename}":`, dlErr);
              continue;
            }
            const buf = new Uint8Array(await fileData.arrayBuffer());
            normalizedForMailgun.push({
              filename: att.filename,
              content: bytesToBase64(buf),
              contentType: att.contentType || fileData.type || 'application/octet-stream',
            });
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(att.path);
            storageMeta[att.filename] = {
              path: att.path,
              url: att.url || urlData.publicUrl,
              bucket,
              size: att.size ?? buf.length,
            };
          }
        } catch (e) {
          console.error(`[reply-email] Error normalizing attachment "${att.filename}":`, e);
        }
      }
    }

    const result = await sendMailgunEmail({
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject || '(Fără subiect)',
      from: fromAddress,
      html: fullHtml,
      customHeaders,
      attachments: normalizedForMailgun,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    console.log('Email sent successfully, saving to sent_emails...');

    // Save sent email to database
    const diagnostics: {
      requestedAttachments: number;
      uploaded: Array<{ name: string; size: number; path: string }>;
      reused: Array<{ name: string; size: number; path: string }>;
      failed: Array<{ name: string; reason: string }>;
      skipped: Array<{ name?: string; reason: string }>;
      dbInsert: 'ok' | 'error' | 'skipped';
      dbError?: string;
    } = {
      requestedAttachments: attachments?.length || 0,
      uploaded: [],
      reused: [],
      failed: [],
      skipped: [],
      dbInsert: 'skipped',
    };

    try {
      // Persist attachments metadata; only re-upload inline base64 ones
      const sentEmailId = crypto.randomUUID();
      const storedAttachments: any[] = [];

      console.log(`[reply-email] Persisting ${diagnostics.requestedAttachments} attachment(s) for sent_email ${sentEmailId}`);

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          try {
            if (!att.filename) {
              diagnostics.skipped.push({ name: att?.filename, reason: 'missing filename' });
              continue;
            }

            // Case A: pre-uploaded — reuse storage metadata, no re-upload
            const meta = storageMeta[att.filename];
            if (meta) {
              storedAttachments.push({
                name: att.filename,
                size: meta.size ?? att.size ?? 0,
                type: att.contentType || 'application/octet-stream',
                url: meta.url || null,
                path: meta.path || null,
                bucket: meta.bucket || 'email-attachments',
              });
              diagnostics.reused.push({ name: att.filename, size: meta.size ?? 0, path: meta.path || '' });
              continue;
            }

            // Case B: inline base64 — upload to storage now
            if (!att.content) {
              diagnostics.skipped.push({ name: att.filename, reason: 'missing content and storage path' });
              continue;
            }

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
        reused: diagnostics.reused.length,
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
