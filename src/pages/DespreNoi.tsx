import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import About from "@/components/About";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { useLanguage } from "@/contexts/LanguageContext";

const DespreNoi = () => {
  const { t } = useLanguage();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: t.about.title, url: "/despre-noi" }
      ]} />
      <Helmet>
        <title>{t.about.title} | MVA Imobiliare</title>
        <meta name="description" content={t.about.description} />
        <meta name="keywords" content="agenție imobiliară București, despre noi, experiență imobiliare, consultanță imobiliară" />
        <link rel="canonical" href="https://www.mvaimobiliare.ro/despre-noi" />
        
        <meta property="og:title" content={`${t.about.title} | MVA Imobiliare`} />
        <meta property="og:description" content={t.about.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mvaimobiliare.ro/despre-noi" />
        <meta property="og:image" content="https://www.mvaimobiliare.ro/og-despre-noi.jpg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t.about.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={t.about.description} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-16 sm:pt-20">
        <div className="container mx-auto px-3 sm:px-4">
          <Breadcrumbs items={[{ label: t.about.title }]} />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-4 mb-6">Despre MVA Imobiliare - Agenție Imobiliară din 2016</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Soluții imobiliare complete în București</h2>
          <p className="text-muted-foreground max-w-3xl mb-6">
            Agenție imobiliară activă în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei — Militari,
            Chiajna și împrejurimi. Investiții sigure, finisaje premium și locații strategice.
          </p>
        </div>

        <About />
      </main>

      <Footer />
    </>
  );
};

export default DespreNoi;
