import Header from "@/components/Header"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Services from "@/components/Services"
import Properties from "@/components/Properties"
import ChatAssistant from "@/components/ChatAssistant"
import Footer from "@/components/Footer"
import AnalyticsDebug from "@/components/AnalyticsDebug"
import { usePageTracking } from "@/hooks/useGoogleAnalytics"

const Index = () => {
  // Track page view pentru pagina principală
  usePageTracking("MVA Imobiliare - Acasă", "/");

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Properties />
        <ChatAssistant />
        
        {/* Debug Panel - Temporar pentru testare GA4 */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <AnalyticsDebug />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
