import { supabase } from "@/integrations/supabase/client";

/**
 * Sursă unică de adevăr pentru evenimentele de conversie (lead-uri).
 * Fiecare eveniment ajunge simultan în:
 *  - GA4 (window.gtag) — pentru dashboard-ul Google Analytics
 *  - Plausible (window.plausible) — dacă este încărcat
 *  - tabelul intern `events` — pentru dashboard-ul din /admin/analytics
 */

export const CONVERSION_EVENTS = {
  clickToCall: "click_to_call",
  whatsappClick: "whatsapp_click",
  emailClick: "email_click",
  contactFormSubmit: "contact_form_submit",
  viewingRequest: "viewing_request",
  jobApplication: "job_application",
} as const;

export type ConversionEvent = (typeof CONVERSION_EVENTS)[keyof typeof CONVERSION_EVENTS];

/** Evenimente care sunt considerate lead-uri „calde" (conversii principale). */
export const LEAD_EVENTS: ConversionEvent[] = [
  CONVERSION_EVENTS.clickToCall,
  CONVERSION_EVENTS.whatsappClick,
  CONVERSION_EVENTS.emailClick,
  CONVERSION_EVENTS.contactFormSubmit,
  CONVERSION_EVENTS.viewingRequest,
];

export const CONVERSION_LABELS: Record<string, string> = {
  [CONVERSION_EVENTS.clickToCall]: "Apeluri (click-to-call)",
  [CONVERSION_EVENTS.whatsappClick]: "WhatsApp",
  [CONVERSION_EVENTS.emailClick]: "Email",
  [CONVERSION_EVENTS.contactFormSubmit]: "Formular contact",
  [CONVERSION_EVENTS.viewingRequest]: "Cerere vizionare",
  [CONVERSION_EVENTS.jobApplication]: "Aplicare carieră",
};

const SESSION_KEY = "mva_session_id";

export const getAnalyticsSessionId = (): string => {
  if (typeof window === "undefined") return "server";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "unknown";
  }
};

export type ConversionProps = Record<string, string | number | boolean | undefined>;

const clean = (props?: ConversionProps): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  Object.entries(props || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
};

/**
 * Trimite un eveniment de conversie către toți providerii de analytics.
 * Sigur de apelat oriunde (no-op pe server, nu aruncă niciodată erori).
 */
export const trackConversion = (event: ConversionEvent | string, props?: ConversionProps): void => {
  if (typeof window === "undefined") return;

  const pagePath = window.location.pathname;
  // Traficul din panoul de administrare nu este conversie.
  if (pagePath.startsWith("/admin")) return;

  const payload = clean({ ...props, page_path: pagePath });
  const isLead = (LEAD_EVENTS as string[]).includes(event);

  try {
    // GA4
    if (typeof window.gtag === "function") {
      window.gtag("event", event, { ...payload, event_category: "conversion" });
      if (isLead) {
        window.gtag("event", "generate_lead", { ...payload, lead_source: event });
      }
    }

    // Plausible (opțional)
    if (typeof window.plausible === "function") {
      window.plausible(event, { props: payload });
    }
  } catch (err) {
    console.warn("[Conversions] provider error:", err);
  }

  // Dashboard intern
  void supabase
    .from("events")
    .insert({
      session_id: getAnalyticsSessionId(),
      event_type: event,
      event_data: payload,
      page_path: pagePath,
    })
    .then(({ error }) => {
      if (error) console.warn("[Conversions] insert error:", error.message);
    });
};
