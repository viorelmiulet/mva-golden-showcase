/**
 * Shared Mailgun email sending utility
 * Used across all edge functions for consistent email delivery
 */

export interface MailgunEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  customHeaders?: Record<string, string>;
}

export interface MailgunResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendMailgunEmail = async (options: MailgunEmailOptions): Promise<MailgunResponse> => {
  const {
    to,
    cc,
    bcc,
    subject,
    html,
    from = "MVA IMOBILIARE <noreply@mvaimobiliare.ro>",
    attachments = [],
    customHeaders = {},
  } = options;

  const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
  const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error("Mailgun credentials not configured");
  }

  const formData = new FormData();
  formData.append("from", from);
  
  // Handle both string and array for 'to'
  const recipients = Array.isArray(to) ? to : [to];
  recipients.forEach((recipient) => formData.append("to", recipient));
  
  // Handle CC recipients
  if (cc) {
    const ccRecipients = Array.isArray(cc) ? cc : [cc];
    ccRecipients.filter(r => r.trim()).forEach((recipient) => formData.append("cc", recipient));
  }
  
  // Handle BCC recipients
  if (bcc) {
    const bccRecipients = Array.isArray(bcc) ? bcc : [bcc];
    bccRecipients.filter(r => r.trim()).forEach((recipient) => formData.append("bcc", recipient));
  }
  
  formData.append("subject", subject);
  formData.append("html", html);

  // Add custom headers (for email threading like In-Reply-To, References)
  for (const [key, value] of Object.entries(customHeaders)) {
    formData.append(`h:${key}`, value);
  }

  // Add attachments if any
  if (attachments && attachments.length > 0) {
    console.log(`Processing ${attachments.length} attachments for Mailgun`);
    for (const attachment of attachments) {
      try {
        if (!attachment.content || !attachment.filename) {
          console.error('Invalid attachment - missing content or filename:', attachment.filename);
          continue;
        }
        
        // Clean base64 string - remove any data URL prefix if present
        let base64Content = attachment.content;
        if (base64Content.includes(',')) {
          base64Content = base64Content.split(',')[1];
        }
        
        // Decode base64 to binary
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: attachment.contentType || 'application/octet-stream' });
        formData.append("attachment", blob, attachment.filename);
        console.log(`Attached file: ${attachment.filename} (${bytes.length} bytes, type: ${attachment.contentType})`);
      } catch (attachError) {
        console.error(`Error processing attachment ${attachment.filename}:`, attachError);
      }
    }
  }

  const response = await fetch(
    `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mailgun error:", errorText);
    return {
      success: false,
      error: `Mailgun API error: ${response.status} - ${errorText}`,
    };
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
  };
};
