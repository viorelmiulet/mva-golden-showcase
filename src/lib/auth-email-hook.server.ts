import * as React from "react";
import { render } from "@react-email/components";
import { parseEmailWebhookPayload } from "@lovable.dev/email-js";
import { WebhookError, verifyWebhookRequest } from "@lovable.dev/webhooks-js";
import { SignupEmail } from "./email-templates/signup";
import { InviteEmail } from "./email-templates/invite";
import { MagicLinkEmail } from "./email-templates/magic-link";
import { RecoveryEmail } from "./email-templates/recovery";
import { EmailChangeEmail } from "./email-templates/email-change";
import { ReauthenticationEmail } from "./email-templates/reauthentication";

export const authEmailHookCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: "Confirm your email",
  invite: "You've been invited",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your new email",
  reauthentication: "Your verification code",
};

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

const SITE_NAME = "mvaimo";
const SENDER_DOMAIN = "notify.mvaimobiliare.ro";
const ROOT_DOMAIN = "mvaimobiliare.ro";
const FROM_DOMAIN = "mvaimobiliare.ro";

const SAMPLE_PROJECT_URL = "https://mvaimo.lovable.app";
const SAMPLE_EMAIL = "user@example.test";
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: "123456",
  },
};

export async function handleAuthEmailHookPreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: previewCorsHeaders });
  }

  const apiKey = process.env.LOVABLE_API_KEY;
  const authHeader = req.headers.get("Authorization");

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...previewCorsHeaders, "Content-Type": "application/json" },
    });
  }

  let type: string;
  try {
    const body = await req.json();
    type = body.type;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { ...previewCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const EmailTemplate = EMAIL_TEMPLATES[type];

  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const sampleData = SAMPLE_DATA[type] || {};
  const html = await render(React.createElement(EmailTemplate, sampleData));

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function handleAuthEmailHookWebhook(req: Request): Promise<Response> {
  const corsHeaders = authEmailHookCorsHeaders;
  const apiKey = process.env.LOVABLE_API_KEY;

  if (!apiKey) {
    console.error("LOVABLE_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  let run_id = "";
  try {
    const verified = await verifyWebhookRequest({
      req,
      secret: apiKey,
      parser: parseEmailWebhookPayload,
    });
    payload = verified.payload;
    run_id = payload.run_id;
  } catch (error) {
    if (error instanceof WebhookError) {
      switch (error.code) {
        case "invalid_signature":
        case "missing_timestamp":
        case "invalid_timestamp":
        case "stale_timestamp":
          console.error("Invalid webhook signature", { error: error.message });
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        case "invalid_payload":
        case "invalid_json":
          console.error("Invalid webhook payload", { error: error.message });
          return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      }
    }

    console.error("Webhook verification failed", { error });
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!run_id) {
    console.error("Webhook payload missing run_id");
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (payload.version !== "1") {
    console.error("Unsupported payload version", { version: payload.version, run_id });
    return new Response(
      JSON.stringify({ error: `Unsupported payload version: ${payload.version}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const emailType = payload.data.action_type;
  console.log("Received auth event", { emailType, email: payload.data.email, run_id });

  const EmailTemplate = EMAIL_TEMPLATES[emailType];
  if (!EmailTemplate) {
    console.error("Unknown email type", { emailType, run_id });
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: payload.data.email,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    newEmail: payload.data.new_email,
  };

  const html = await render(React.createElement(EmailTemplate, templateProps));
  const text = await render(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const messageId = crypto.randomUUID();

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: "pending",
  });

  const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "auth_emails",
    payload: {
      run_id,
      message_id: messageId,
      to: payload.data.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: EMAIL_SUBJECTS[emailType] || "Notification",
      html,
      text,
      purpose: "transactional",
      label: emailType,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("Failed to enqueue auth email", { error: enqueueError, run_id, emailType });
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: payload.data.email,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return new Response(JSON.stringify({ error: "Failed to enqueue email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("Auth email enqueued", { emailType, email: payload.data.email, run_id });

  return new Response(JSON.stringify({ success: true, queued: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
