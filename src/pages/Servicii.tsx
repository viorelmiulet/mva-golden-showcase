import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Services from "@/components/Services";
import { useLanguage } from "@/contexts/LanguageContext";

const Servicii = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t.services.title} | MVA Imobiliare</title>
        <meta name="description" content={t.services.subtitle} />
        <meta name="keywords" content="servicii imobiliare, cumpărare proprietăți, vânzare case, închiriere apartamente, consultanță imobiliară" />
        <link rel="canonical" href="https://mvaimobiliare.ro/servicii" />
        
        <meta property="og:title" content={`${t.services.title} | MVA Imobiliare`} />
        <meta property="og:description" content={t.services.subtitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/servicii" />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t.services.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={t.services.subtitle} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <Services />
      </main>

      <Footer />
    </>
  );
};

export default Servicii;
