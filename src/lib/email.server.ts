/**
 * Shared server-only email infrastructure (Mailgun).
 * Port of supabase/functions/_shared/mailgun.ts + emailSettings.ts.
 * Server-only: never import from components.
 */

export interface MailgunAttachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

export interface MailgunEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: MailgunAttachment[];
  customHeaders?: Record<string, string>;
}

export interface MailgunResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM_EMAIL = "noreply@mvaimobiliare.ro";
const DEFAULT_FROM_NAME = "MVA Imobiliare";

export const formatFromAddress = (fromEmail: string, fromName: string) =>
  `${fromName} <${fromEmail}>`;

/** Reads the per-function sender configured in email_function_settings. */
export async function getFromAddressForFunction(
  functionName: string,
  defaultEmail = DEFAULT_FROM_EMAIL,
  defaultName = DEFAULT_FROM_NAME,
): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_function_settings")
      .select("from_email, from_name, is_active")
      .eq("function_name", functionName)
      .maybeSingle();

    if (error || !data || !data.is_active) {
      return formatFromAddress(defaultEmail, defaultName);
    }
    return formatFromAddress(data.from_email, data.from_name || defaultName);
  } catch (err) {
    console.error("getFromAddressForFunction failed:", err);
    return formatFromAddress(defaultEmail, defaultName);
  }
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function sendMailgunEmail(
  options: MailgunEmailOptions,
): Promise<MailgunResponse> {
  const {
    to,
    cc,
    bcc,
    subject,
    html,
    from = formatFromAddress(DEFAULT_FROM_EMAIL, "MVA IMOBILIARE"),
    attachments = [],
    customHeaders = {},
  } = options;

  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) throw new Error("Mailgun credentials not configured");

  const form = new FormData();
  form.append("from", from);

  const list = (v?: string | string[]) =>
    (Array.isArray(v) ? v : v ? [v] : []).filter((r) => r.trim().length > 0);

  list(to).forEach((r) => form.append("to", r));
  list(cc).forEach((r) => form.append("cc", r));
  list(bcc).forEach((r) => form.append("bcc", r));

  form.append("subject", subject);
  form.append("html", html);

  for (const [key, value] of Object.entries(customHeaders)) {
    form.append(`h:${key}`, value);
  }

  for (const attachment of attachments) {
    if (!attachment.content || !attachment.filename) continue;
    try {
      const bytes = base64ToBytes(attachment.content);
      const blob = new Blob([bytes], {
        type: attachment.contentType || "application/octet-stream",
      });
      form.append("attachment", blob, attachment.filename);
    } catch (err) {
      console.error(`Attachment ${attachment.filename} failed:`, err);
    }
  }

  const response = await fetch(`https://api.eu.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mailgun error:", errorText);
    return { success: false, error: `Mailgun API error: ${response.status}` };
  }

  const result = (await response.json()) as { id?: string };
  return { success: true, messageId: result.id };
}
