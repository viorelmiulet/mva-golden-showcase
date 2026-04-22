import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Services from "@/components/Services";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { useLanguage } from "@/contexts/LanguageContext";

const Servicii = () => {
  const { t } = useLanguage();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: t.services.title, url: "/servicii" }
      ]} />
      <Helmet>
        <title>{t.services.title} | MVA Imobiliare</title>
        <meta name="description" content={t.services.subtitle} />
        <meta name="keywords" content="servicii imobiliare, cumpărare proprietăți, vânzare case, închiriere apartamente, consultanță imobiliară" />
        <link rel="canonical" href="https://mvaimobiliare.ro/servicii" />
        
        <meta property="og:title" content={`${t.services.title} | MVA Imobiliare`} />
        <meta property="og:description" content={t.services.subtitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/servicii" />
        <meta property="og:image" content="https://mvaimobiliare.ro/og-default.jpg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t.services.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={t.services.subtitle} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-16 sm:pt-20">
        <div className="container mx-auto px-3 sm:px-4">
          <Breadcrumbs items={[{ label: t.services.title }]} />
        </div>
        <Services />
      </main>

      <Footer />
    </>
  );
};

export default Servicii;
