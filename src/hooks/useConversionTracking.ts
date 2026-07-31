import { useEffect } from "react";
import {
  CONVERSION_EVENTS,
  trackConversion,
  type ConversionEvent,
  type ConversionProps,
} from "@/lib/analytics/conversions";

const isWhatsApp = (href: string) =>
  /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href) || href.startsWith("whatsapp:");

const detect = (href: string): ConversionEvent | null => {
  if (href.startsWith("tel:")) return CONVERSION_EVENTS.clickToCall;
  if (isWhatsApp(href)) return CONVERSION_EVENTS.whatsappClick;
  if (href.startsWith("mailto:")) return CONVERSION_EVENTS.emailClick;
  return null;
};

/**
 * Captează automat, la nivel de document, toate click-urile pe linkuri
 * de tip telefon / WhatsApp / email — indiferent de pagină sau componentă.
 */
export const useConversionAutoCapture = () => {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const event = detect(href);
      if (!event) return;

      const props: ConversionProps = {
        source: anchor.dataset["conversionSource"] || undefined,
        property_id: anchor.dataset["propertyId"] || undefined,
        label: (anchor.getAttribute("aria-label") || anchor.textContent || "").trim().slice(0, 80),
      };

      trackConversion(event, props);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
};

export { trackConversion, CONVERSION_EVENTS };
