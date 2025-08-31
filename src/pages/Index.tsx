import Header from "@/components/Header"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Services from "@/components/Services"
import Properties from "@/components/Properties"
import Contact from "@/components/Contact"
import Footer from "@/components/Footer"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"
import { useEffect } from "react"

const Index = () => {
  // Track page view pentru pagina principală
  usePageTracking("MVA Imobiliare - Acasă", "/");

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
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
    </div>
  );
};

export default Index;
