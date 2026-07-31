import { getMailgunConfig } from "./runtimeConfig.server";

export type MailgunEventItem = {
  id: string;
  event: string;
  timestamp: number;
  recipient: string;
  sender: string | null;
  subject: string | null;
  severity: string | null;
  reason: string | null;
  code: string | number | null;
  description: string | null;
  message: string | null;
  logLevel: string | null;
};

export type MailgunEventsResult = {
  success: boolean;
  error?: string;
  items: MailgunEventItem[];
  domain?: string | null;
  counts: Record<string, number>;
};

const EVENT_TYPES = ["delivered", "failed", "rejected", "complained", "unsubscribed", "opened", "accepted"] as const;

function normalize(raw: any): MailgunEventItem {
  const ds = raw?.["delivery-status"] ?? {};
  return {
    id: String(raw?.id ?? `${raw?.timestamp}-${raw?.recipient}`),
    event: String(raw?.event ?? "unknown"),
    timestamp: Number(raw?.timestamp ?? 0),
    recipient: String(raw?.recipient ?? raw?.message?.headers?.to ?? ""),
    sender: raw?.message?.headers?.from ?? raw?.envelope?.sender ?? null,
    subject: raw?.message?.headers?.subject ?? null,
    severity: raw?.severity ?? null,
    reason: raw?.reason ?? null,
    code: ds?.code ?? raw?.["delivery-status"]?.code ?? null,
    description: ds?.description || raw?.description || null,
    message: ds?.message || ds?.["session-seconds"] === undefined ? ds?.message ?? null : null,
    logLevel: raw?.["log-level"] ?? null,
  };
}

/**
 * Reads delivery events (bounces, failures, complaints, deliveries) straight
 * from the Mailgun Events API so the admin can see why a message did not
 * reach its recipient. Mailgun keeps events for ~30 days.
 */
export async function fetchMailgunEvents(params: {
  event?: string;
  recipient?: string;
  limit?: number;
}): Promise<MailgunEventsResult> {
  const { apiKey, domain } = await getMailgunConfig();
  if (!apiKey || !domain) {
    return { success: false, error: "Mailgun credentials not configured", items: [], counts: {} };
  }

  const search = new URLSearchParams();
  search.set("limit", String(Math.min(Math.max(params.limit ?? 100, 1), 300)));
  if (params.event && params.event !== "all") {
    search.set("event", params.event);
  } else {
    search.set("event", EVENT_TYPES.join(" OR "));
  }
  if (params.recipient) search.set("recipient", params.recipient);

  const url = `https://api.eu.mailgun.net/v3/${domain}/events?${search.toString()}`;
  const auth = btoa(`api:${apiKey}`);

  try {
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[mailgunEvents] ${res.status}: ${text}`);
      return { success: false, error: `Mailgun ${res.status}: ${text}`, items: [], counts: {}, domain };
    }
    const json = JSON.parse(text);
    const items: MailgunEventItem[] = (json?.items ?? []).map(normalize);
    const counts: Record<string, number> = {};
    for (const it of items) counts[it.event] = (counts[it.event] ?? 0) + 1;
    return { success: true, items, counts, domain };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mailgunEvents] request failed:", err);
    return { success: false, error: message, items: [], counts: {}, domain };
  }
}
