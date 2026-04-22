import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQ = () => {
  const { t } = useLanguage();
  
  const faqItems = t.faq.items;

  // Build FAQ schema from actual displayed items
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: "Întrebări Frecvente", url: "/intrebari-frecvente" }
      ]} />
      <Helmet>
        <title>Întrebări Frecvente despre Apartamente Militari – MVA Imobiliare</title>
        <meta name="description" content="Răspunsuri la întrebările frecvente despre cumpărarea, vânzarea și închirierea apartamentelor în cartierul Militari, Sector 6 București." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="întrebări frecvente imobiliare Militari, FAQ agenție imobiliară, comision agenție, vânzare apartament Militari, cumpărare apartament Sector 6" />
        <link rel="canonical" href="https://mvaimobiliare.ro/intrebari-frecvente" />
        
        <meta property="og:title" content="Întrebări Frecvente despre Apartamente Militari – MVA Imobiliare" />
        <meta property="og:description" content="Răspunsuri la întrebările frecvente despre cumpărarea, vânzarea și închirierea apartamentelor în cartierul Militari, Sector 6 București." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/intrebari-frecvente" />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:image" content="https://mvaimobiliare.ro/og-default.jpg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Întrebări Frecvente despre Apartamente Militari – MVA Imobiliare" />
        <meta name="twitter:description" content="Răspunsuri la întrebările frecvente despre apartamentele din cartierul Militari." />
        
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <section className="py-12 sm:py-16 bg-background">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            {/* Breadcrumbs */}
            <Breadcrumbs items={[{ label: t.faq.title }]} />

            <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground px-2">
                {t.faq.title}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-2 mb-6">
                {t.faq.subtitle}
              </p>
              <div className="text-left max-w-3xl mx-auto text-sm sm:text-base text-muted-foreground space-y-3 px-4 sm:px-2">
                <p>
                  MVA Imobiliare este o agenție imobiliară specializată în tranzacții cu proprietăți din zona Militari, Sector 6 București și Chiajna, Ilfov. 
                  De-a lungul activității noastre, am răspuns la sute de întrebări din partea clienților care doresc să cumpere, să vândă sau să închirieze un apartament în această zonă.
                </p>
                <p>
                  Mai jos am compilat cele mai frecvente întrebări și răspunsurile detaliate ale consultanților noștri. Fie că sunteți la prima tranzacție imobiliară 
                  sau sunteți un investitor experimentat, veți găsi informații utile despre comisioane, documente necesare, evaluarea proprietăților, procesul de vânzare-cumpărare, 
                  asistența juridică și serviciile noastre de închiriere. Dacă nu găsiți răspunsul căutat, nu ezitați să ne contactați direct.
                </p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-2 sm:px-0">
              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border rounded-lg px-3 sm:px-4 lg:px-6 bg-card"
                  >
                    <AccordionTrigger className="text-left text-sm sm:text-base lg:text-lg font-semibold hover:no-underline py-4 touch-manipulation">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pt-2 text-sm sm:text-base">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-8 sm:mt-12 p-4 sm:p-6 lg:p-8 rounded-lg bg-gold/5 border border-gold/20 text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-foreground px-2">
                  {t.faq.stillQuestions}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
                  {t.faq.helpText}
                </p>
                <a
                  href="tel:+40726555888"
                  className="inline-block px-6 sm:px-8 py-3 bg-gold text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-gold/90 transition-colors touch-manipulation min-h-[44px]"
                >
                  {t.faq.contactUs}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default FAQ;