import { lazy, Suspense, useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { HelmetProvider } from "@/lib/helmet-compat";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import TrailingSlashRedirect from "@/components/TrailingSlashRedirect";
import NotFound from "@/pages/NotFound";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import appCss from "../styles.css?url";

const CookieConsent = lazy(() => import("@/components/CookieConsent"));
const ScrollIndicator = lazy(() => import("@/components/ScrollIndicator"));
const DeferredAnalytics = lazy(() => import("@/components/DeferredAnalytics"));
const DeferredShell = lazy(() => import("@/components/DeferredShell"));

// Page-level title/description/og/twitter/canonical tags are owned by each route
// (route head() or the page's Helmet block) — the shell must not emit a second set.


// Google Consent Mode v2 — defaults to DENIED. Updated by CookieConsent.tsx after user consent.
// GA4 / Plausible / Maps / Pixel scripts are NOT loaded here; CookieConsent.tsx injects them
// only after the user grants the matching category.
const CONSENT_MODE_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'url_passthrough', true);
gtag('set', 'ads_data_redaction', true);
`;




const JSONLD_ORGANIZATION = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "MVA Imobiliare",
  description:
    "Agenție imobiliară activă în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei — Militari, Chiajna și împrejurimi",
  url: "https://www.mvaimobiliare.ro/",
  logo: "https://www.mvaimobiliare.ro/mva-logo-full.svg",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+40-767-941-512",
    contactType: "sales",
    availableLanguage: ["Romanian", "English"],
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "București",
    addressCountry: "RO",
  },
  areaServed: [
    { "@type": "City", name: "București" },
    { "@type": "City", name: "Chiajna" },
  ],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: "Servicii Imobiliare Premium",
      description: "Consultanță imobiliară, vânzare și cumpărare proprietăți premium",
    },
  },
});

const JSONLD_WEBSITE = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MVA Imobiliare",
  url: "https://www.mvaimobiliare.ro/",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.mvaimobiliare.ro/proprietati?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
});

const JSONLD_NAVIGATION = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Navigare principală MVA Imobiliare",
  itemListElement: [
    { "@type": "SiteNavigationElement", position: 1, name: "Acasă", url: "https://www.mvaimobiliare.ro/" },
    { "@type": "SiteNavigationElement", position: 2, name: "Proprietăți", url: "https://www.mvaimobiliare.ro/proprietati" },
    { "@type": "SiteNavigationElement", position: 3, name: "Ansambluri Rezidențiale", url: "https://www.mvaimobiliare.ro/complexe" },
    { "@type": "SiteNavigationElement", position: 4, name: "Servicii", url: "https://www.mvaimobiliare.ro/servicii" },
    { "@type": "SiteNavigationElement", position: 5, name: "Despre Noi", url: "https://www.mvaimobiliare.ro/despre-noi" },
    { "@type": "SiteNavigationElement", position: 6, name: "Blog", url: "https://www.mvaimobiliare.ro/blog" },
    { "@type": "SiteNavigationElement", position: 7, name: "Contact", url: "https://www.mvaimobiliare.ro/contact" },
  ],
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      {
        name: "keywords",
        content:
          "agenție imobiliară București, apartamente de vânzare București, ansambluri rezidențiale, apartamente Militari, apartamente Chiajna, proprietăți premium, MVA Imobiliare",
      },
      { name: "author", content: "MVA IMOBILIARE" },
      { name: "googlebot", content: "index, follow, max-image-preview:large" },
      { name: "bingbot", content: "index, follow" },
      { name: "google-site-verification", content: "wJfWVfZiGs4Tl0iih3cb1TotB3Fd1nt86hCkmqohNus" },
      { name: "msvalidate.01", content: "61211F66C499AA2A96C0CBC828ECEE20" },
      { name: "geo.region", content: "RO-B" },
      { name: "geo.placename", content: "București, Chiajna" },
      { name: "geo.position", content: "44.4268;25.9667" },
      { name: "ICBM", content: "44.4268, 25.9667" },
      /* PWA / install meta tags */
      { name: "theme-color", content: "#0F1115" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "MVA Imobiliare" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "MVA Imobiliare" },
      /* Open Graph — only sitewide constants; page-level tags come from each route */
      { property: "og:site_name", content: "MVA Imobiliare" },
      { property: "og:locale", content: "ro_RO" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      /* Preconnect / dns-prefetch */
      { rel: "preconnect", href: "https://fdpandnzblzvamhsoukt.supabase.co", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.googleapis.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://apcdn.immoflux.ro", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://apcdn.immoflux.ro" },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
      { rel: "dns-prefetch", href: "https://plausible.io" },
      /* Favicons — Google requires PNG 48x48+ */
      { rel: "icon", href: "/favicon.ico?v=20260725", sizes: "48x48" },
      { rel: "icon", href: "/favicon-mva.svg?v=20260725", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-192.png?v=20260725", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/favicon-192.png?v=20260725" },
      /* Google Fonts */
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@144,400..700,0,1&family=IBM+Plex+Mono:wght@500&family=Inter:wght@400;500;600&display=swap",
        crossOrigin: "anonymous",
      },
      { rel: "alternate", type: "text/plain", href: "https://www.mvaimobiliare.ro/llms.txt", title: "LLM Context" },
    ],
    scripts: [
      { children: CONSENT_MODE_SCRIPT },
      
      { type: "application/ld+json", children: JSONLD_ORGANIZATION },
      { type: "application/ld+json", children: JSONLD_WEBSITE },
      { type: "application/ld+json", children: JSONLD_NAVIGATION },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <AppShell />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

// ported from main.tsx — unregister legacy PWA service workers and clear stale caches
async function cleanupLegacyServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (sessionStorage.getItem("sw_cleaned")) return;
  sessionStorage.setItem("sw_cleaned", "1");
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return;
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
    }
  } catch (error) {
    console.warn("Service worker cleanup failed", error);
  }
}

// Ported from src/App.tsx AppRoutes — deferred UI/analytics gating around the route outlet.
function AppShell() {
  const [showDeferredUi, setShowDeferredUi] = useState(false);
  const [showDeferredAnalytics, setShowDeferredAnalytics] = useState(false);

  useEffect(() => {
    // ported from main.tsx
    void cleanupLegacyServiceWorkers();
    const preloadErrorHandler = (event: Event) => {
      event.preventDefault();
      window.location.reload();
    };
    window.addEventListener("vite:preloadError", preloadErrorHandler);
    return () => window.removeEventListener("vite:preloadError", preloadErrorHandler);
  }, []);

  useEffect(() => {
    const enableDeferredUi = () => setShowDeferredUi(true);
    const enableDeferredAnalytics = () => setShowDeferredAnalytics(true);
    let analyticsTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let analyticsIdleId: number | null = null;

    const scheduleDeferredAnalytics = () => {
      if ("requestIdleCallback" in window) {
        analyticsIdleId = window.requestIdleCallback(enableDeferredAnalytics, { timeout: 2500 });
        return;
      }
      analyticsTimeoutId = globalThis.setTimeout(enableDeferredAnalytics, 1500);
    };

    const clearDeferredAnalytics = () => {
      if (analyticsIdleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(analyticsIdleId);
      }
      if (analyticsTimeoutId !== null) {
        window.clearTimeout(analyticsTimeoutId);
      }
    };

    if (document.readyState === "complete") {
      const idleId = globalThis.setTimeout(enableDeferredUi, 0);
      scheduleDeferredAnalytics();
      return () => {
        window.clearTimeout(idleId);
        clearDeferredAnalytics();
      };
    }

    window.addEventListener("load", enableDeferredUi, { once: true });
    const loadHandler = () => {
      scheduleDeferredAnalytics();
    };
    window.addEventListener("load", loadHandler, { once: true });
    return () => {
      window.removeEventListener("load", enableDeferredUi);
      window.removeEventListener("load", loadHandler);
    };
  }, []);

  return (
    <>
      <TrailingSlashRedirect />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div
              className="h-10 w-10 rounded-full border-2 border-brass/30 border-t-brass animate-spin"
              aria-label="Se încarcă"
            />
          </div>
        }
      >
        <Outlet />
      </Suspense>
      {showDeferredUi && (
        <AppErrorBoundary>
          <Suspense fallback={null}>
            <DeferredShell />
            <CookieConsent />
            <ScrollIndicator />
          </Suspense>
        </AppErrorBoundary>
      )}
      {showDeferredAnalytics && (
        <AppErrorBoundary>
          <Suspense fallback={null}>
            <DeferredAnalytics />
          </Suspense>
        </AppErrorBoundary>
      )}
    </>
  );
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg border border-border bg-card p-8 text-center">
        <p className="text-spec text-muted-foreground">MVA Imobiliare</p>
        <h1 className="text-display-md mt-4 text-foreground">Această pagină nu s-a încărcat</h1>
        <p className="text-body mt-3 text-muted-foreground">
          A apărut o eroare. Poți reîncerca sau te poți întoarce la pagina principală.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Încearcă din nou
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center border border-border px-6 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Pagina principală
          </a>
        </div>
      </div>
    </div>
  );
}
