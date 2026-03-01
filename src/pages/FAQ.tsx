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

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Care este prețul mediu al unui apartament cu 2 camere în cartierul Militari?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Prețul mediu al unui apartament cu 2 camere în Militari variază între 75.000 și 120.000 de euro, în funcție de zonă, etaj și finisaje. Contactați MVA Imobiliare pentru o evaluare gratuită."
        }
      },
      {
        "@type": "Question",
        "name": "Ce documente sunt necesare pentru cumpărarea unui apartament?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cumpărătorul are nevoie de act de identitate și dovada finanțării. Vânzătorul trebuie să prezinte actul de proprietate, extras de carte funciară actualizat, adeverință de la asociația de proprietari, certificat energetic și acordul băncii dacă imobilul este ipotecat."
        }
      },
      {
        "@type": "Question",
        "name": "Cât este comisionul agenției MVA Imobiliare?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Comisionul standard este de 2% + TVA din valoarea tranzacției, plătit la semnarea contractului la notar. Include evaluare, promovare, vizionări, negociere și asistență completă."
        }
      },
      {
        "@type": "Question",
        "name": "Cât timp durează procesul de vânzare a unui apartament în Militari?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Durata medie este de 30–90 de zile. Apartamentele corect evaluate se vând în 3–6 săptămâni. Procesul notarial durează 1–3 săptămâni după găsirea cumpărătorului."
        }
      },
      {
        "@type": "Question",
        "name": "Ce impozite se plătesc la vânzarea unui apartament?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vânzătorul plătește 3% impozit dacă deține imobilul sub 3 ani, sau 1% dacă îl deține peste 3 ani. Cumpărătorul plătește taxa notarială și taxa de intabulare de 0,15%."
        }
      },
      {
        "@type": "Question",
        "name": "Pot obține credit ipotecar pentru un apartament din Militari?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Da, apartamentele din Militari sunt eligibile pentru credit ipotecar la toate băncile. Avans minim recomandat: 15–25%. MVA Imobiliare colaborează cu consultanți financiari care oferă preaprobari gratuit."
        }
      },
      {
        "@type": "Question",
        "name": "Care sunt cele mai bune zone din Militari pentru cumpărat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Gorjului și Lujerului — acces la metrou. Iuliu Maniu — școli și comerciale. Pacii și Apusului — liniștit, spații verzi. Virtutii și Uverturii — prețuri accesibile cu potențial de creștere."
        }
      },
      {
        "@type": "Question",
        "name": "Gestionați și proprietăți de închiriat în Militari?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Da. Oferim servicii complete: promovare, selectare chiriași, contract și asistență. Chirii medii: garsoniere 300–500 €/lună, 2 camere 400–650 €/lună, 3 camere 550–850 €/lună."
        }
      }
    ]
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
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
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
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-2">
                {t.faq.subtitle}
              </p>
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