import Header from "@/components/Header"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Services from "@/components/Services"
import Properties from "@/components/Properties"
import Contact from "@/components/Contact"
import Footer from "@/components/Footer"
import ChatWidget from "@/components/ChatWidget"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { useEffect } from "react"
import { Helmet } from "react-helmet-async"

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
          <Properties />
          <Contact />
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </>
  );
};

export default Index;
