export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Facilități și stil de viață în Militari Residence — tot ce oferă zona",
  description:
    "Descoperă facilitățile din Militari Residence: parcuri, săli de fitness, centre comerciale, școli, restaurante și viața de cartier. Ghid complet pentru viitori locuitori.",
  author: { "@type": "Organization", name: "MVA Imobiliare" },
  publisher: {
    "@type": "Organization",
    name: "MVA Imobiliare",
    logo: {
      "@type": "ImageObject",
      url: "https://www.mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
    },
  },
  mainEntityOfPage: canonical,
  image: "https://www.mvaimobiliare.ro/og-image.jpg",
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Ce facilități există în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence oferă parcuri și spații verzi, centre comerciale (Auchan, Carrefour, Cora), săli de fitness, clinici private, școli și grădinițe, restaurante și cafenele, plus acces rapid la metrou și autostradă.",
      },
    },
    {
      "@type": "Question",
      name: "Unde poți face cumpărături în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "În zonă găsești Auchan Militari, Carrefour, Cora Lujerului, Militari Shopping Center, La Strada și numeroase magazine de proximitate. Sunt disponibile și piețe agroalimentare pentru producători locali.",
      },
    },
    {
      "@type": "Question",
      name: "Există școli și grădinițe în apropiere?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da. În și lângă Militari Residence funcționează Școala Gimnazială nr. 1 Chiajna, grădinițe private (Smart Kids, Happy Kids, Olga Gudynn) și creșe. Liceele din Sectorul 6 sunt la 10–15 minute.",
      },
    },
    {
      "@type": "Question",
      name: "Ce opțiuni de sport și relaxare există?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zona dispune de săli de fitness, centre Wellness & Spa, parcuri cu alei pentru alergare și plimbări, locuri de joacă pentru copii și terenuri de sport în interiorul cartierului.",
      },
    },
  ],
};
