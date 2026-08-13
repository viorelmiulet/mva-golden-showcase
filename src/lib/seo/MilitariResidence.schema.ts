export const structuredData = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "MVA Imobiliare",
  areaServed: {
    "@type": "Place",
    name: "Militari Residence, Chiajna, Ilfov",
  },
  url: "https://www.mvaimobiliare.ro/militari-residence",
};

export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Cât costă un apartament cu 2 camere în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Prețurile variază între 70.000 și 85.000€ în funcție de etaj, orientare și finisaje. Contactați MVA Imobiliare pentru o evaluare gratuită.",
      },
    },
    {
      "@type": "Question",
      name: "Militari Residence este în București sau Ilfov?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence este în comuna Chiajna, județul Ilfov, la granița cu Sectorul 6 București.",
      },
    },
    {
      "@type": "Question",
      name: "Se poate lua credit ipotecar pentru apartamentele din Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da, toate apartamentele sunt eligibile pentru credit ipotecar. MVA Imobiliare colaborează cu consultanți financiari care oferă preaprobarea gratuit.",
      },
    },
  ],
};
