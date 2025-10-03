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

  return (
    <>
      <Helmet>
        <title>MVA Imobiliare - Agenție Imobiliară Premium în Chiajna și Vestul Bucureștiului</title>
        <meta name="description" content="MVA Imobiliare - Agenție imobiliară de încredere specializată în apartamente și case premium în Chiajna, Militari Residence și vestul Bucureștiului. Consultanță expertă în vânzare și cumpărare proprietăți." />
        <meta name="keywords" content="agenție imobiliară București, apartamente Chiajna, case premium vest București, Militari Residence, vânzare apartamente, cumpărare proprietăți, agent imobiliar București" />
        <link rel="canonical" href="https://mva-imobiliare.lovable.app/" />
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
