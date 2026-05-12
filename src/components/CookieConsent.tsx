import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_CONSENT_KEY = "cookieConsent";
const COOKIE_CONSENT_TIMESTAMP_KEY = "cookieConsentTimestamp";
const GA_ID = "G-HLZFTKHC80";

// Expiry period for cookie consent preferences (180 days, in ms)
const CONSENT_EXPIRY_MS = 180 * 24 * 60 * 60 * 1000;
const CONSENT_EXPIRY_SECONDS = Math.floor(CONSENT_EXPIRY_MS / 1000);

type ConsentValue = "accepted" | "rejected";

const getConsentFromCookie = () => {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_KEY}=`));

  return cookie ? cookie.split("=")[1] : null;
};

const clearStoredConsent = () => {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_CONSENT_TIMESTAMP_KEY);
  } catch {
    // ignore
  }

  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `${COOKIE_CONSENT_TIMESTAMP_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
};

const getStoredConsent = (): ConsentValue | null => {
  let value: string | null = null;
  let timestamp: string | null = null;

  try {
    value = localStorage.getItem(COOKIE_CONSENT_KEY);
    timestamp = localStorage.getItem(COOKIE_CONSENT_TIMESTAMP_KEY);
  } catch {
    // ignore
  }

  if (!value) {
    value = getConsentFromCookie();
  }

  if (!value) return null;

  // If we have a timestamp, validate freshness
  if (timestamp) {
    const ts = parseInt(timestamp, 10);
    if (!Number.isNaN(ts) && Date.now() - ts > CONSENT_EXPIRY_MS) {
      clearStoredConsent();
      return null;
    }
  } else {
    // No timestamp recorded → treat as legacy entry and reset so the user re-consents
    clearStoredConsent();
    return null;
  }

  return value as ConsentValue;
};

const setStoredConsent = (value: ConsentValue) => {
  const now = Date.now().toString();

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    localStorage.setItem(COOKIE_CONSENT_TIMESTAMP_KEY, now);
  } catch {
    // Ignore storage errors (e.g. strict/incognito environments)
  }

  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_CONSENT_KEY}=${value}; path=/; max-age=${CONSENT_EXPIRY_SECONDS}; SameSite=Lax`;
    document.cookie = `${COOKIE_CONSENT_TIMESTAMP_KEY}=${now}; path=/; max-age=${CONSENT_EXPIRY_SECONDS}; SameSite=Lax`;
  }
};

let ga4Loaded = false;

const loadGA4 = () => {
  if (ga4Loaded || typeof document === "undefined") return;
  ga4Loaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
};

const scheduleGA4Load = () => {
  if (ga4Loaded || typeof window === "undefined") return;

  const start = () => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    };

    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => loadGA4(), { timeout: 4000 });
    } else {
      window.setTimeout(() => loadGA4(), 1500);
    }
  };

  if (document.readyState === "complete") {
    start();
    return;
  }

  window.addEventListener("load", start, { once: true });
};


const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = getStoredConsent();

    if (consent === "accepted") {
      scheduleGA4Load();
      return;
    }

    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    setStoredConsent("accepted");
    scheduleGA4Load();
    setIsVisible(false);
  };

  const rejectCookies = () => {
    setStoredConsent("rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:right-auto sm:w-full sm:max-w-sm xl:max-w-md">
      <Card className="border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div className="flex-1">
            <h3 className="mb-2 text-sm font-semibold">
              {t.cookies?.message?.split(".")[0] || "Cookie Consent"}
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {t.cookies?.message || "We use cookies to improve your experience on our site."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={acceptCookies} size="sm" className="text-xs">
                {t.cookies?.accept || "Accept"}
              </Button>
              <Button onClick={rejectCookies} variant="outline" size="sm" className="text-xs">
                {t.cookies?.decline || "Decline"}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={rejectCookies}
            aria-label="Închide bannerul de cookies"
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
