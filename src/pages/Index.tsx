import Header from "@/components/Header"
import HeroBand from "@/components/home/HeroBand"
import LatestProperties from "@/components/home/LatestProperties"
import DevelopmentsRow from "@/components/home/DevelopmentsRow"
import ZoneNav from "@/components/home/ZoneNav"
import Footer from "@/components/Footer"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { useEffect } from "react"
import { Helmet } from "@/lib/helmet-compat"
import BreadcrumbSchema from "@/components/BreadcrumbSchema"



const Index = () => {
  // Track page view pentru pagina principală
  usePageTracking("MVA Imobiliare - Acasă", "/");

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.mvaimobiliare.ro/#localbusiness",
    "name": "MVA Imobiliare",
    "image": "https://www.mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "logo": "https://www.mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    "url": "https://www.mvaimobiliare.ro",
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
        <title>Agenție Imobiliară București | Apartamente și Ansambluri Rezidențiale — MVA Imobiliare</title>
        <meta name="description" content="Agenție imobiliară în București: apartamente de vânzare, închirieri și ansambluri rezidențiale în toată Capitala, cu expertiză aprofundată în vestul Bucureștiului — Militari, Chiajna și împrejurimi." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="agenție imobiliară București, apartamente de vânzare București, ansambluri rezidențiale București, apartamente Militari, apartamente Chiajna, agent imobiliar București, vânzare apartamente Sector 6" />
        <link rel="canonical" href="https://www.mvaimobiliare.ro/" />
        
        {/* Sitemaps */}
        <link rel="sitemap" type="application/xml" href="https://www.mvaimobiliare.ro/sitemap.xml" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="MVA Imobiliare este o agenție imobiliară activă în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei (Militari, Chiajna și împrejurimi). Oferă servicii de vânzare, cumpărare și închiriere proprietăți, consultanță expertă, evaluări gratuite și asistență completă în tranzacții imobiliare. Contact: 0767941512, email: contact@mvaimobiliare.ro" />
        <meta name="category" content="Real Estate Agency" />
        <meta name="coverage" content="București, Militari, Chiajna, Sector 6, Romania" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mvaimobiliare.ro/" />
        <meta property="og:title" content="Agenție Imobiliară București | Apartamente și Ansambluri Rezidențiale — MVA Imobiliare" />
        <meta property="og:description" content="Apartamente de vânzare și ansambluri rezidențiale în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei — Militari, Chiajna și împrejurimi." />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.mvaimobiliare.ro/" />
        <meta property="twitter:title" content="Agenție Imobiliară București | Apartamente și Ansambluri Rezidențiale — MVA Imobiliare" />
        <meta property="twitter:description" content="Apartamente de vânzare și ansambluri rezidențiale în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei — Militari, Chiajna și împrejurimi." />
        <meta property="twitter:image" content="https://www.mvaimobiliare.ro/og-image.jpg" />


        {/* Structured Data for AI */}
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "În ce zone din București activează MVA Imobiliare?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "MVA Imobiliare este o agenție imobiliară activă în tot Bucureștiul și în localitățile limitrofe, cu expertiză aprofundată în vestul Capitalei — Militari, Chiajna, Sector 6, Drumul Taberei, Crângași și Giulești. Intermediem tranzacții și în alte zone precum Titan, Pantelimon, Berceni, Giurgiului, Tineretului și Văcărești."
                }
              },
              {
                "@type": "Question",
                "name": "Ce servicii imobiliare oferă MVA Imobiliare?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Oferim servicii complete de vânzare și închiriere apartamente, consultanță pentru investiții imobiliare, evaluări profesionale, intermediere în ansambluri rezidențiale noi, consultanță juridică pentru tranzacții și management de proprietăți. Colaborăm cu dezvoltatori pentru complexe precum Militari Residence, Renew Residence și Eurocasa Residence."
                }
              },
              {
                "@type": "Question",
                "name": "De ce este MVA Imobiliare specializată pe Militari și Chiajna?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Cu peste 10 ani de experiență, echipa MVA Imobiliare cunoaște în detaliu piața din vestul Bucureștiului — Militari, Chiajna și Sector 6 — inclusiv ansamblurile rezidențiale noi, infrastructura, școlile, mijloacele de transport și evoluția prețurilor. Această expertiză locală ne permite să recomandăm cele mai potrivite proprietăți pentru fiecare client."
                }
              },
              {
                "@type": "Question",
                "name": "Cât costă serviciile unei agenții imobiliare?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Comisionul se stabilește transparent, în funcție de tipul tranzacției (vânzare sau închiriere) și de valoarea proprietății. Consultanța inițială, evaluarea proprietății și prezentarea ofertelor sunt gratuite. Pentru detalii personalizate ne puteți contacta la 0767941512 sau la contact@mvaimobiliare.ro."
                }
              },
              {
                "@type": "Question",
                "name": "Cum pot programa o vizionare la un apartament?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Puteți programa o vizionare direct din pagina proprietății folosind butonul „Programează vizionare”, sau ne puteți contacta telefonic la 0767941512, pe WhatsApp, ori prin email la contact@mvaimobiliare.ro. Vizionările sunt gratuite și pot fi organizate inclusiv în weekend."
                }
              },
              {
                "@type": "Question",
                "name": "Ajutați și cumpărătorii cu credit ipotecar sau programul Noua Casă?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Da. Oferim consultanță pentru achiziții cu credit ipotecar și programul Noua Casă, inclusiv recomandări de bănci partenere, ghid pas cu pas al procesului de finanțare și un calculator de credit disponibil pe site. Vă ajutăm să estimați rata lunară înainte de a face o ofertă."
                }
              }
            ]
          })}
        </script>

      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <HeroBand />
          <LatestProperties />
          <DevelopmentsRow />
          <ZoneNav />
        </main>
        <Footer />
      </div>

    </>
  );
};

export default Index;
