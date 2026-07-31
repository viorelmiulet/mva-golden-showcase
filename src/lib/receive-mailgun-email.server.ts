/**
 * Port of supabase/functions/receive-mailgun-email/index.ts
 * Inbound Mailgun multipart webhook: parses email + attachments, uploads
 * attachments to storage, and inserts a row into received_emails.
 */

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function handleReceiveMailgunEmail(req: Request): Promise<Response> {
  try {
    console.log("Received Mailgun webhook");

    const formData = await req.formData();

    const sender = (formData.get("sender") as string) || (formData.get("from") as string) || "";
    const recipient = (formData.get("recipient") as string) || (formData.get("To") as string) || "";
    const subject = (formData.get("subject") as string) || "(Fără subiect)";
    const bodyPlain = (formData.get("body-plain") as string) || "";
    const bodyHtml = (formData.get("body-html") as string) || "";
    const strippedText = (formData.get("stripped-text") as string) || "";
    const messageId = (formData.get("Message-Id") as string) || "";
    const inReplyTo = (formData.get("In-Reply-To") as string) || "";
    const timestamp = formData.get("timestamp") as string;

    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");

    const emailId = crypto.randomUUID();

    const attachmentCount = parseInt((formData.get("attachment-count") as string) || "0");
    const attachments: any[] = [];

    console.log(`Processing ${attachmentCount} attachments`);

    for (let i = 1; i <= attachmentCount; i++) {
      const attachment = formData.get(`attachment-${i}`);
      if (attachment instanceof File) {
        try {
          const arrayBuffer = await attachment.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filePath = `${emailId}/${sanitizedName}`;

          const { error: uploadError } = await supabase.storage
            .from("email-attachments")
            .upload(filePath, uint8Array, {
              contentType: attachment.type,
              upsert: true,
            });

          if (uploadError) {
            console.error(`Error uploading attachment ${attachment.name}:`, uploadError);
            attachments.push({
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              url: null,
              path: null,
              bucket: "email-attachments",
              error: uploadError.message,
            });
          } else {
            const { data: urlData } = supabase.storage
              .from("email-attachments")
              .getPublicUrl(filePath);

            console.log(`Uploaded attachment: ${attachment.name} -> ${urlData.publicUrl}`);

            attachments.push({
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              url: urlData.publicUrl,
              path: filePath,
              bucket: "email-attachments",
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
            bucket: "email-attachments",
            error: String(attachError),
          });
        }
      }
    }

    console.log("Email data:", { sender, recipient, subject, attachmentCount, attachments: attachments.length });

    const receivedAt = timestamp
      ? new Date(parseInt(timestamp) * 1000).toISOString()
      : new Date().toISOString();

    const { data, error } = await supabase
      .from("received_emails")
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
      console.error("Error inserting email:", error);
      throw error;
    }

    console.log("Email saved successfully:", data.id);

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing Mailgun webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
