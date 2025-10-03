import Header from "@/components/Header"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Services from "@/components/Services"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { useEffect, lazy, Suspense } from "react"
import { Helmet } from "react-helmet-async"

// Lazy load components that are below the fold
const Properties = lazy(() => import("@/components/Properties"))
const Contact = lazy(() => import("@/components/Contact"))
const Footer = lazy(() => import("@/components/Footer"))
const ChatWidget = lazy(() => import("@/components/ChatWidget"))

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
    "image": "https://mva-imobiliare.lovable.app/mva-logo-luxury-horizontal.svg",
    "logo": "https://mva-imobiliare.lovable.app/mva-logo-luxury-horizontal.svg",
    "url": "https://mva-imobiliare.lovable.app",
    "telephone": "+40767941512",
    "email": "contact@mvaimobiliare.ro",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Chiajna",
      "addressRegion": "Ilfov",
      "addressCountry": "RO"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "44.4268",
      "longitude": "25.9667"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "București"
      },
      {
        "@type": "City", 
        "name": "Chiajna"
      }
    ],
    "serviceType": [
      "Vânzare apartamente",
      "Cumpărare proprietăți",
      "Consultanță imobiliară",
      "Evaluare proprietăți",
      "Management proprietăți"
    ],
    "priceRange": "€€€",
    "knowsAbout": [
      "Piața imobiliară București",
      "Apartamente premium",
      "Investiții imobiliare",
      "Tranzacții imobiliare"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MVA Imobiliare",
    "url": "https://mva-imobiliare.lovable.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mva-imobiliare.lovable.app/proprietati?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <Helmet>
        <title>MVA Imobiliare - Agenție Imobiliară Premium în Chiajna și Vestul Bucureștiului</title>
        <meta name="description" content="MVA Imobiliare - Agenție imobiliară de încredere specializată în apartamente și case premium în Chiajna, Militari Residence și vestul Bucureștiului. Consultanță expertă în vânzare și cumpărare proprietăți." />
        <meta name="keywords" content="agenție imobiliară București, apartamente Chiajna, case premium vest București, Militari Residence, vânzare apartamente, cumpărare proprietăți, agent imobiliar București" />
        <link rel="canonical" href="https://mva-imobiliare.lovable.app/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mva-imobiliare.lovable.app/" />
        <meta property="og:title" content="MVA Imobiliare - Agenție Imobiliară Premium în Chiajna" />
        <meta property="og:description" content="Apartamente și case premium în Chiajna și vestul Bucureștiului. Consultanță expertă în tranzacții imobiliare." />
        <meta property="og:image" content="https://mva-imobiliare.lovable.app/mva-logo-luxury-horizontal.svg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://mva-imobiliare.lovable.app/" />
        <meta property="twitter:title" content="MVA Imobiliare - Agenție Imobiliară Premium" />
        <meta property="twitter:description" content="Apartamente și case premium în Chiajna și vestul Bucureștiului." />
        <meta property="twitter:image" content="https://mva-imobiliare.lovable.app/mva-logo-luxury-horizontal.svg" />

        {/* Structured Data for AI */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      </Helmet>
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <About />
          <Services />
          <Suspense fallback={<div className="py-24" />}>
            <Properties />
          </Suspense>
          <Suspense fallback={<div className="py-24" />}>
            <Contact />
          </Suspense>
        </main>
        <Suspense fallback={<div />}>
          <Footer />
        </Suspense>
        <Suspense fallback={<div />}>
          <ChatWidget />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
