import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

interface ComplexFAQProps {
  complexName: string;
  location?: string | null;
  priceRange?: string | null;
  surfaceRange?: string | null;
  roomsRange?: string | null;
  totalApartments: number;
  availableApartments: number;
  developer?: string | null;
  completionDate?: string | null;
  amenities?: string[] | null;
}

interface FAQItem {
  question: string;
  answer: string;
}

const generateFAQs = (props: ComplexFAQProps): FAQItem[] => {
  const {
    complexName,
    location,
    priceRange,
    surfaceRange,
    roomsRange,
    totalApartments,
    availableApartments,
    developer,
    completionDate,
    amenities,
  } = props;

  const faqs: FAQItem[] = [];

  // 1. Where is the complex located?
  faqs.push({
    question: `Unde este situat ${complexName}?`,
    answer: location
      ? `${complexName} este situat în ${location}, o zonă din vestul Bucureștiului cu acces rapid la transportul public și servicii esențiale. Locația oferă un echilibru optim între liniștea unei zone rezidențiale și proximitatea față de centrele comerciale.`
      : `${complexName} se află într-o zonă rezidențială din vestul Bucureștiului, cu acces facil la transportul public, școli, grădinițe și centre comerciale.`,
  });

  // 2. Available apartments
  faqs.push({
    question: `Câte apartamente sunt disponibile în ${complexName}?`,
    answer: `În prezent, ${complexName} are ${availableApartments} apartamente disponibile din totalul de ${totalApartments} unități. ${roomsRange ? `Configurațiile disponibile includ apartamente cu ${roomsRange} camere.` : ''} ${surfaceRange ? `Suprafețele variază între ${surfaceRange}.` : ''} Stocul se actualizează în timp real — te recomandăm să ne contactezi pentru cele mai recente disponibilități.`,
  });

  // 3. Price range
  if (priceRange) {
    faqs.push({
      question: `Care sunt prețurile apartamentelor în ${complexName}?`,
      answer: `Prețurile apartamentelor în ${complexName} pornesc de la ${priceRange}. Prețul final depinde de tipul apartamentului, etaj, orientare și finisaje. Contactează-ne la 0767 941 512 pentru o ofertă personalizată sau programează o vizionare gratuită.`,
    });
  }

  // 4. Finishes & amenities
  if (amenities && amenities.length > 0) {
    faqs.push({
      question: `Ce facilități oferă ${complexName}?`,
      answer: `${complexName} dispune de următoarele facilități: ${amenities.join(', ')}. Aceste dotări sunt concepute pentru a oferi un standard ridicat de locuire și confort zilnic rezidenților.`,
    });
  }

  // 5. Developer
  if (developer) {
    faqs.push({
      question: `Cine este dezvoltatorul ${complexName}?`,
      answer: `${complexName} este dezvoltat de ${developer}. MVA Imobiliare colaborează cu dezvoltatori verificați pentru a vă oferi siguranța unei investiții imobiliare de calitate. Toate documentele legale sunt în regulă, iar construcția respectă normele în vigoare.`,
    });
  }

  // 6. Completion date
  if (completionDate) {
    faqs.push({
      question: `Când este termenul de finalizare al ${complexName}?`,
      answer: `Termenul estimat de finalizare pentru ${complexName} este ${completionDate}. Recomandăm rezervarea apartamentului din timp pentru a beneficia de prețuri avantajoase și de posibilitatea de a alege unitățile preferate.`,
    });
  }

  // 7. How to buy
  faqs.push({
    question: `Cum pot achiziționa un apartament în ${complexName}?`,
    answer: `Pentru a achiziționa un apartament în ${complexName}, contactează echipa MVA Imobiliare la numărul 0767 941 512 sau prin WhatsApp. Procesul include: (1) vizionare gratuită la fața locului, (2) selectarea apartamentului preferat, (3) rezervare cu avans, (4) semnarea contractului cu asistența juridică inclusă. Oferim consultanță completă pe tot parcursul tranzacției.`,
  });

  // 8. Credit / financing
  faqs.push({
    question: `Pot cumpăra un apartament în ${complexName} prin credit ipotecar?`,
    answer: `Da, apartamentele din ${complexName} pot fi achiziționate prin credit ipotecar. MVA Imobiliare colaborează cu consultanți financiari care te pot ghida în obținerea celui mai avantajos credit. Oferim și un simulator de credit pe site-ul nostru pentru o estimare rapidă a ratei lunare.`,
  });

  return faqs;
};

/**
 * Generate FAQPage JSON-LD schema for complex detail pages.
 */
export const generateComplexFAQSchema = (props: ComplexFAQProps) => {
  const faqs = generateFAQs(props);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

const ComplexFAQ = (props: ComplexFAQProps) => {
  const faqs = generateFAQs(props);

  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="faq-heading">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h2
          id="faq-heading"
          className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-gold"
        >
          Întrebări Frecvente — {props.complexName}
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`faq-${index}`}
            className="card-modern border border-border/50 rounded-xl px-4 sm:px-6 overflow-hidden"
          >
            <AccordionTrigger className="text-sm sm:text-base font-medium text-left py-4 hover:text-primary transition-colors">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default ComplexFAQ;
