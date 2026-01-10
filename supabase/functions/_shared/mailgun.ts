/**
 * Shared Mailgun email sending utility
 * Used across all edge functions for consistent email delivery
 */

export interface MailgunEmailOptions {
  to: string | string[];
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
  
  formData.append("subject", subject);
  formData.append("html", html);

  // Add custom headers (for email threading like In-Reply-To, References)
  for (const [key, value] of Object.entries(customHeaders)) {
    formData.append(`h:${key}`, value);
  }

  // Add attachments if any
  for (const attachment of attachments) {
    const binaryData = Uint8Array.from(atob(attachment.content), (c) => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: attachment.contentType });
    formData.append("attachment", blob, attachment.filename);
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
