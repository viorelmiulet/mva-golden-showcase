import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Care sunt comisioanele agenției?",
    answer: "Comisionul standard pentru serviciile noastre este competitiv și transparent. Acesta variază în funcție de tipul și valoarea proprietății. Vă vom prezenta toate detaliile și costurilepentru serviciile noastre încă de la prima consultație, fără costuri ascunse.",
  },
  {
    question: "Cât durează procesul de vânzare a unei proprietăți?",
    answer: "Durata medie de vânzare depinde de mai mulți factori: locația, prețul, starea proprietății și condițiile pieței. În medie, o proprietate bine evaluată se vinde în 2-3 luni. Echipa noastră folosește strategii de marketing eficiente pentru a accelera procesul.",
  },
  {
    question: "Cum evaluați o proprietate?",
    answer: "Evaluarea se face pe baza unei analize detaliate care include: locația, suprafața utilă, starea proprietății, dotările și finisajele, prețurile similare din zonă, și tendințele actuale ale pieței. Oferim evaluări gratuite pentru proprietățile pe care le listăm.",
  },
  {
    question: "Ce documente sunt necesare pentru vânzarea unei proprietăți?",
    answer: "Documentele principale includ: actul de proprietate (contractul de vânzare-cumpărare), certificatul de atestare fiscală, certificatul energetic, certificatul de urbanism, extras de carte funciară, și dovada achitării taxelor și impozitelor. Vă vom asista în pregătirea tuturor documentelor necesare.",
  },
  {
    question: "Oferiți servicii de asistență juridică?",
    answer: "Da, colaborăm cu notari și avocați cu experiență în tranzacții imobiliare. Vă putem recomanda specialiști de încredere și vă asistăm pe parcursul întregului proces, de la verificarea actelor până la semnarea contractului final.",
  },
  {
    question: "Pot viziona proprietăți în weekend?",
    answer: "Desigur! Înțelegem că programul dvs. poate fi încărcat în timpul săptămânii. Organizăm vizionări și în weekend, după programare. Suntem flexibili și ne adaptăm nevoilor clienților noștri.",
  },
  {
    question: "Cum vă asigurați că proprietățile listate sunt verificate?",
    answer: "Toate proprietățile din portofoliul nostru trec printr-un proces riguros de verificare: validăm documentele de proprietate, verificăm starea tehnică a imobilului, confirmăm informațiile furnizate de proprietar și ne asigurăm că toate datele prezentate sunt corecte și actualizate.",
  },
  {
    question: "Oferiți servicii de închiriere?",
    answer: "Da, oferim servicii complete de închiriere, atât pentru proprietari cât și pentru chiriași. Gestionăm întregul proces: promovarea proprietății, selecția chiriașilor, verificarea bonității, întocmirea contractului și asistență pe parcursul perioadei de închiriere.",
  },
  {
    question: "Cum pot lista proprietatea mea pe site-ul dvs.?",
    answer: "Procesul este simplu: ne contactați telefonic, prin email sau completați formularul de pe site. Un consultant vă va vizita pentru evaluarea proprietății, vom face fotografii profesionale și vom crea anunțul. Proprietatea va fi promovată pe site-ul nostru și pe toate platformele relevante.",
  },
  {
    question: "Oferiți consultanță pentru investiții imobiliare?",
    answer: "Da, oferim servicii de consultanță pentru investitori interesați de piața imobiliară din București și Ilfov. Vă putem ajuta să identificați oportunități profitabile, să analizați rentabilitatea investițiilor și să luați decizii informate bazate pe datele reale ale pieței.",
  },
];

const FAQ = () => {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
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
      <Helmet>
        <title>Întrebări Frecvente - FAQ | MVA Imobiliare</title>
        <meta name="description" content="Răspunsuri la cele mai frecvente întrebări despre serviciile MVA Imobiliare: comisioane, proces de vânzare, evaluări, documente necesare și mult mai mult." />
        <meta name="keywords" content="întrebări frecvente imobiliare, FAQ agenție imobiliară, comision agenție, vânzare casă, cumpărare apartament" />
        <link rel="canonical" href="https://mvaimobiliare.ro/faq" />
        
        <meta property="og:title" content="Întrebări Frecvente - FAQ | MVA Imobiliare" />
        <meta property="og:description" content="Răspunsuri la cele mai frecvente întrebări despre serviciile MVA Imobiliare: comisioane, proces de vânzare, evaluări, documente necesare și mult mai mult." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/faq" />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Întrebări Frecvente - FAQ | MVA Imobiliare" />
        <meta name="twitter:description" content="Răspunsuri la cele mai frecvente întrebări despre serviciile MVA Imobiliare" />
        <meta name="twitter:image" content="https://mvaimobiliare.ro/mva-logo-luxury.svg" />
        
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-20">
        <section className="py-12 sm:py-16 bg-background">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground px-2">
                Întrebări Frecvente
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-2">
                Răspunsuri la cele mai comune întrebări despre serviciile noastre
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
                  Nu ai găsit răspunsul pe care îl căutai?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
                  Echipa noastră este aici să te ajute! Contactează-ne și vom răspunde tuturor întrebărilor tale.
                </p>
                <a
                  href="tel:+40726555888"
                  className="inline-block px-6 sm:px-8 py-3 bg-gold text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-gold/90 transition-colors touch-manipulation min-h-[44px]"
                >
                  Contactează-ne
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
