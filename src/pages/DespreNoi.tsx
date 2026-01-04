import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import About from "@/components/About";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useLanguage } from "@/contexts/LanguageContext";

const DespreNoi = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t.about.title} | MVA Imobiliare</title>
        <meta name="description" content={t.about.description} />
        <meta name="keywords" content="agenție imobiliară București, despre noi, experiență imobiliare, consultanță imobiliară" />
        <link rel="canonical" href="https://mvaimobiliare.ro/despre-noi" />
        
        <meta property="og:title" content={`${t.about.title} | MVA Imobiliare`} />
        <meta property="og:description" content={t.about.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/despre-noi" />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t.about.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={t.about.description} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: t.about.title }]} />
        </div>
        <About />
      </main>

      <Footer />
    </>
  );
};

export default DespreNoi;
