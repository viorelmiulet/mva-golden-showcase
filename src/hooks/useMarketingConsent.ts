import { useEffect, useState } from "react";

/**
 * Marketing-cookie consent state, mirroring the gating used by the map embed.
 * Third-party video iframes stay blocked until the user accepts.
 */
export function useMarketingConsent() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const current = (window as unknown as { __mvaConsent?: { marketing?: boolean } }).__mvaConsent;
    if (current?.marketing) setConsent(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ marketing?: boolean }>).detail;
      setConsent(Boolean(detail?.marketing));
    };
    window.addEventListener("mva-consent-change", onChange as EventListener);
    return () => window.removeEventListener("mva-consent-change", onChange as EventListener);
  }, []);

  return consent;
}

export const openCookieSettings = () =>
  window.dispatchEvent(new Event("open-cookie-settings"));
