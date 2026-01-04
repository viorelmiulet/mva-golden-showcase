import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: t.contact.title, url: "/contact" }
      ]} />
      <Helmet>
        <title>{t.contact.title} | MVA Imobiliare</title>
        <meta name="description" content={t.contact.subtitle} />
        <meta name="keywords" content="contact agenție imobiliară, telefon MVA Imobiliare, email, program, adresă" />
        <link rel="canonical" href="https://mvaimobiliare.ro/contact" />
        
        <meta property="og:title" content={`${t.contact.title} | MVA Imobiliare`} />
        <meta property="og:description" content={t.contact.subtitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/contact" />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t.contact.title} | MVA Imobiliare`} />
        <meta name="twitter:description" content={t.contact.subtitle} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: t.contact.title }]} />
        </div>
        <Contact />
      </main>

      <Footer />
    </>
  );
};

export default ContactPage;
