import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { X, Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * GDPR + Google Consent Mode v2 compliant consent manager.
 *
 * Categories:
 *  - necessary  (always on, cannot be disabled)
 *  - analytics  (GA4 + Plausible)
 *  - marketing  (ads / pixels / 3rd-party embeds like Google Maps iframe)
 *
 * NO non-essential script is loaded until the matching category is granted.
 * Defaults for Google Consent Mode v2 are set to "denied" inline in index.html.
 *
 * Re-open the banner anywhere:
 *   window.dispatchEvent(new Event('open-cookie-settings'))
 *   or
 *   window.openCookieSettings?.()
 */

const STORAGE_KEY = "mva_cookie_consent_v2";
const LEGACY_KEYS = ["cookieConsent", "cookieConsentTimestamp"];
const CONSENT_EXPIRY_MS = 180 * 24 * 60 * 60 * 1000;
const GA_ID = "G-HLZFTKHC80";

type Categories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = Categories & { ts: number };

declare global {
  interface Window {
    openCookieSettings?: () => void;
    __mvaConsent?: Categories;
  }
}

type PlausibleQueue = ((...args: unknown[]) => void) & {
  q?: unknown[];
  init?: (opts?: unknown) => void;
  o?: unknown;
};

// --- storage helpers ---
const clearLegacy = () => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    LEGACY_KEYS.forEach((k) => {
      document.cookie = `${k}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
  }
};

const readStored = (): StoredConsent | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > CONSENT_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
};

const writeStored = (c: Categories) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...c, ts: Date.now() } satisfies StoredConsent)
    );
  } catch {
    /* ignore */
  }
};

// --- analytics cookie cleanup when denied ---
const clearTrackingCookies = () => {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const rootDomain = host.split(".").slice(-2).join(".");
  const kill = (name: string) => {
    const variants = [
      `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `${name}=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `${name}=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `${name}=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    ];
    variants.forEach((v) => (document.cookie = v));
  };
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((n) =>
      /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc|FPID|FPLC|__utm|_clck|_clsk|_hjSession)/i.test(
        n
      )
    )
    .forEach(kill);
};

// --- script injectors (idempotent) ---
let ga4Injected = false;
const injectGA4 = () => {
  if (ga4Injected || typeof document === "undefined") return;
  ga4Injected = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.gtag?.("js", new Date());
  window.gtag?.("config", GA_ID, { anonymize_ip: true, send_page_view: false });
};

let plausibleInjected = false;
const injectPlausible = () => {
  if (plausibleInjected || typeof document === "undefined") return;
  plausibleInjected = true;
  const w = window as unknown as { plausible?: PlausibleQueue };
  const queue: PlausibleQueue =
    w.plausible ||
    Object.assign(
      function (...args: unknown[]) {
        (queue.q = queue.q || []).push(args);
      },
      { q: [] as unknown[] }
    );
  queue.init =
    queue.init ||
    function (i?: unknown) {
      queue.o = i || {};
    };
  w.plausible = queue;
  queue.init();
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://plausible.io/js/pa-f5f3NmrOiA-HrfgXtStSS.js";
  document.head.appendChild(s);
};

// --- apply consent ---
const applyConsent = (c: Categories) => {
  window.__mvaConsent = c;

  const granted = (v: boolean) => (v ? "granted" : "denied");
  window.gtag?.("consent", "update", {
    ad_storage: granted(c.marketing),
    ad_user_data: granted(c.marketing),
    ad_personalization: granted(c.marketing),
    analytics_storage: granted(c.analytics),
  });

  if (c.analytics) {
    injectGA4();
    injectPlausible();
  } else {
    clearTrackingCookies();
  }

  // notify the rest of the app (e.g. Google Maps embed) that consent changed
  window.dispatchEvent(
    new CustomEvent("mva-consent-change", { detail: c })
  );
};

const isDoNotTrack = () => {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & {
    msDoNotTrack?: string;
    globalPrivacyControl?: boolean;
  };
  const w = window as Window & { doNotTrack?: string };
  const dnt = n.doNotTrack ?? w.doNotTrack ?? n.msDoNotTrack;
  if (dnt === "1" || dnt === "yes") return true;
  if (n.globalPrivacyControl === true) return true;
  return false;
};

const CookieConsent = () => {
  const { language } = useLanguage();
  const isRo = language === "ro";

  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const t = isRo
    ? {
        title: "Setări cookie-uri",
        body:
          "Folosim cookie-uri esențiale pentru funcționarea site-ului. Cu acordul tău, folosim și cookie-uri pentru analiză și marketing. Poți schimba alegerea oricând din „Setări Cookie-uri” în footer.",
        acceptAll: "Accept toate",
        rejectAll: "Refuz toate",
        customize: "Personalizează",
        save: "Salvează preferințele",
        close: "Închide",
        necessary: "Necesare",
        necessaryDesc: "Esențiale pentru funcționarea site-ului. Nu pot fi dezactivate.",
        analytics: "Analytics",
        analyticsDesc: "Ne ajută să înțelegem cum este folosit site-ul (Google Analytics, Plausible).",
        marketing: "Marketing",
        marketingDesc: "Conținut terț și măsurare publicitară (ex. hartă Google Maps, pixeli).",
        always: "Întotdeauna activ",
      }
    : {
        title: "Cookie settings",
        body:
          "We use essential cookies to run the site. With your consent we also use analytics and marketing cookies. You can change your choice anytime from “Cookie settings” in the footer.",
        acceptAll: "Accept all",
        rejectAll: "Reject all",
        customize: "Customize",
        save: "Save preferences",
        close: "Close",
        necessary: "Necessary",
        necessaryDesc: "Essential for the site to function. Cannot be disabled.",
        analytics: "Analytics",
        analyticsDesc: "Help us understand how the site is used (Google Analytics, Plausible).",
        marketing: "Marketing",
        marketingDesc: "Third-party content & ad measurement (e.g. Google Maps, pixels).",
        always: "Always on",
      };

  // initial mount: migrate legacy, apply saved consent or show banner
  useEffect(() => {
    clearLegacy();

    if (isDoNotTrack()) {
      applyConsent({ necessary: true, analytics: false, marketing: false });
      return;
    }

    const stored = readStored();
    if (stored) {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
      applyConsent(stored);
      return;
    }

    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // expose open-settings hooks
  useEffect(() => {
    const open = () => {
      const stored = readStored();
      if (stored) {
        setAnalytics(stored.analytics);
        setMarketing(stored.marketing);
      }
      setShowDetails(true);
      setIsVisible(true);
    };
    window.openCookieSettings = open;
    window.addEventListener("open-cookie-settings", open);
    return () => {
      window.removeEventListener("open-cookie-settings", open);
      if (window.openCookieSettings === open) delete window.openCookieSettings;
    };
  }, []);

  const persist = useCallback((c: Categories) => {
    writeStored(c);
    applyConsent(c);
    setIsVisible(false);
    setShowDetails(false);
  }, []);

  const acceptAll = () =>
    persist({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () =>
    persist({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () =>
    persist({ necessary: true, analytics, marketing });

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-3 sm:p-4 pointer-events-none"
    >
      <Card className="pointer-events-auto w-full max-w-2xl border bg-background/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{t.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={rejectAll}
                aria-label={t.close}
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t.body}
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3 rounded-md border bg-muted/30 p-3">
                <CategoryRow
                  title={t.necessary}
                  desc={t.necessaryDesc}
                  alwaysOnLabel={t.always}
                  locked
                  checked
                />
                <CategoryRow
                  title={t.analytics}
                  desc={t.analyticsDesc}
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <CategoryRow
                  title={t.marketing}
                  desc={t.marketingDesc}
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={acceptAll} className="text-xs">
                {t.acceptAll}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={rejectAll}
                className="text-xs"
              >
                {t.rejectAll}
              </Button>
              {showDetails ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={saveCustom}
                  className="text-xs"
                >
                  {t.save}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(true)}
                  className="text-xs"
                >
                  {t.customize}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              )}
              {showDetails && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(false)}
                  className="text-xs"
                  aria-label={t.close}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CategoryRow = ({
  title,
  desc,
  checked,
  onChange,
  locked,
  alwaysOnLabel,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
  alwaysOnLabel?: string;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
    {locked ? (
      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
        {alwaysOnLabel}
      </span>
    ) : (
      <Switch
        checked={checked}
        onCheckedChange={(v) => onChange?.(Boolean(v))}
        aria-label={title}
      />
    )}
  </div>
);

export default CookieConsent;
