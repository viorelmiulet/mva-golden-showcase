import { Helmet } from "@/lib/helmet-compat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import About from "@/components/About";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHero from "@/components/PageHero";
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
        <div className="container mx-auto px-4 lg:px-6 pt-4">
          <Breadcrumbs items={[{ label: t.about.title }]} />
        </div>
        <PageHero
          eyebrow="DESPRE NOI"
          title="Despre MVA Imobiliare — agenție imobiliară din 2016"
          subtitle="Agenție imobiliară activă în tot Bucureștiul, cu expertiză aprofundată în vestul Capitalei — Militari, Chiajna și împrejurimi. Investiții sigure, finisaje premium și locații strategice."
        />

        <About />
      </main>

      <Footer />
    </>
  );
};

export default DespreNoi;
