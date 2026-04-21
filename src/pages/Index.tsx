import Header from "@/components/Header"
import Hero from "@/components/Hero"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { useEffect, lazy, Suspense } from "react"
import { Helmet } from "react-helmet-async"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"

// Lazy load components that are below the fold
const About = lazy(() => import("@/components/About"))
const TrustBadges = lazy(() => import("@/components/TrustBadges"))
const Services = lazy(() => import("@/components/Services"))
const Properties = lazy(() => import("@/components/Properties"))
const Contact = lazy(() => import("@/components/Contact"))
const Footer = lazy(() => import("@/components/Footer"))
const PWAInstallBanner = lazy(() => import("@/components/PWAInstallBanner"))
const ScheduleViewingSection = lazy(() => import("@/components/ScheduleViewingSection"))


const Index = () => {
  // Track page view pentru pagina principală
  usePageTracking("MVA Imobiliare - Acasă", "/");

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Organization Schema for AI understanding
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "MVA Imobiliare",
    "url": "https://mvaimobiliare.ro",
    "logo": "https://mvaimobiliare.ro/logo.png",
    "image": "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "description": "Agenție imobiliară specializată în cartierul Militari, Sector 6, București. Vânzări, cumpărări și închirieri de apartamente.",
    "telephone": "+40767941512",
    "email": "contact@mvaimobiliare.ro",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "București",
      "addressRegion": "Sector 6",
      "addressCountry": "RO"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Militari, Sector 6, București"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Romanian"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "44.4268",
      "longitude": "25.9667"
    },
    "sameAs": [
      "https://www.facebook.com/mvaimobiliare",
      "https://www.instagram.com/mvaimobiliare"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MVA Imobiliare",
    "url": "https://mvaimobiliare.ro",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mvaimobiliare.ro/proprietati?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://mvaimobiliare.ro/#localbusiness",
    "name": "MVA Imobiliare",
    "image": "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "logo": "https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "url": "https://mvaimobiliare.ro",
    "telephone": "+40767941512",
    "email": "contact@mvaimobiliare.ro",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Strada Principală",
      "addressLocality": "Chiajna",
      "addressRegion": "Ilfov",
      "postalCode": "077040",
      "addressCountry": "RO"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "44.4268",
      "longitude": "25.9667"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "10:00",
        "closes": "14:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/mvaimobiliare",
      "https://www.instagram.com/mvaimobiliare"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Servicii Imobiliare",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Vânzare Apartamente"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Consultanță Imobiliară"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Evaluare Proprietăți"
          }
        }
      ]
    }
  };

  return (
    <>
      <BreadcrumbSchema items={[{ name: "Acasă", url: "/" }]} />
      <Helmet>
        <title>Apartamente de Vânzare și Închiriere Militari – MVA Imobiliare</title>
        <meta name="description" content="Agenție imobiliară specializată în cartierul Militari, Sector 6 București. Apartamente de vânzare și închiriere în Gorjului, Lujerului, Iuliu Maniu, Pacii. Evaluare gratuită. Sună acum!" />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="agenție imobiliară București, apartamente Militari, apartamente Gorjului, apartamente Lujerului, apartamente Iuliu Maniu, apartamente Pacii, vânzare apartamente Sector 6, agent imobiliar București" />
        <link rel="canonical" href="https://mvaimobiliare.ro/" />
        
        {/* Sitemaps */}
        <link rel="sitemap" type="application/xml" href="https://mvaimobiliare.ro/sitemap.xml" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="MVA Imobiliare este o agenție imobiliară specializată în zona Militari și vestul Bucureștiului, oferind servicii de vânzare și cumpărare proprietăți, consultanță expertă, evaluări gratuite și asistență completă în tranzacții imobiliare. Contact: 0767941512, email: contact@mvaimobiliare.ro" />
        <meta name="category" content="Real Estate Agency" />
        <meta name="coverage" content="București, Militari, Sector 6, Romania" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/" />
        <meta property="og:title" content="Apartamente de Vânzare Militari – MVA Imobiliare" />
        <meta property="og:description" content="Agenție imobiliară locală în cartierul Militari. Apartamente de vânzare și închiriere, evaluare gratuită." />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://mvaimobiliare.ro/" />
        <meta property="twitter:title" content="Apartamente de Vânzare Militari – MVA Imobiliare" />
        <meta property="twitter:description" content="Agenție imobiliară locală în cartierul Militari. Apartamente de vânzare și închiriere, evaluare gratuită." />
        <meta property="twitter:image" content="https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg" />

        {/* Structured Data for AI */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <div style={{ contentVisibility: "auto" }}>
            <Suspense fallback={<div className="py-24" />}>
              <Properties />
            </Suspense>
          </div>
          <div style={{ contentVisibility: "auto" }}>
            <Suspense fallback={<div className="py-24" />}>
              <About />
            </Suspense>
          </div>
          <div style={{ contentVisibility: "auto" }}>
            <Suspense fallback={<div className="py-16" />}>
              <TrustBadges />
            </Suspense>
          </div>
          <div style={{ contentVisibility: "auto" }}>
            <Suspense fallback={<div className="py-24" />}>
              <Services />
            </Suspense>
          </div>
          <div style={{ contentVisibility: "auto" }}>
            <Suspense fallback={<div className="py-24" />}>
              <Contact />
            </Suspense>
          </div>
        </main>
        <div style={{ contentVisibility: "auto" }}>
          <Suspense fallback={<div />}>
            <Footer />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <PWAInstallBanner />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
