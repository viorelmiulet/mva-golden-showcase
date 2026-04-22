import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

export interface ResidenceFAQItem {
  question: string;
  answer: string;
}

interface ResidenceFAQProps {
  title: string;
  faqs: ResidenceFAQItem[];
}

const ResidenceFAQ = ({ title, faqs }: ResidenceFAQProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section className="py-12 lg:py-16" aria-labelledby="residence-faq-heading">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="container mx-auto px-4 lg:px-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="h-6 w-6 text-gold" />
          <h2
            id="residence-faq-heading"
            className="text-2xl sm:text-3xl font-bold text-gradient-gold"
          >
            {title}
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`r-faq-${i}`}
              className="card-modern border border-border/50 rounded-xl px-4 sm:px-6 overflow-hidden"
            >
              <AccordionTrigger className="text-sm sm:text-base font-medium text-left py-4 hover:text-gold transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default ResidenceFAQ;
