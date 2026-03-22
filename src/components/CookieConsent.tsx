import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_CONSENT_KEY = "cookieConsent";
const GA_ID = "G-HLZFTKHC80";

type ConsentValue = "accepted" | "rejected";

const getConsentFromCookie = () => {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_KEY}=`));

  return cookie ? cookie.split("=")[1] : null;
};

const getStoredConsent = () => {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) || getConsentFromCookie();
  } catch {
    return getConsentFromCookie();
  }
};

const setStoredConsent = (value: ConsentValue) => {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Ignore storage errors (e.g. strict/incognito environments)
  }

  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_CONSENT_KEY}=${value}; path=/; max-age=31536000; SameSite=Lax`;
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
  window.gtag("config", GA_ID);
};


const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = getStoredConsent();

    if (consent === "accepted") {
      loadGA4();
      return;
    }

    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    setStoredConsent("accepted");
    loadGA4();
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