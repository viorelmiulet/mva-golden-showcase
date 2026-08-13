const canonical = "https://www.mvaimobiliare.ro/viata-in-militari-residence";

export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Viața în Militari Residence — cum e să locuiești aici în 2026: avantaje, dezavantaje și sfaturi",
  description:
    "Ghid onest despre viața în Militari Residence: comunitate, rutină zilnică, trafic, școli, magazine, avantaje și dezavantaje reale, sfaturi pentru cumpărători de apartamente.",
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
      name: "Cum este să locuiești în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence oferă un stil de viață modern, urban, cu acces rapid la magazine, școli și transport. Comunitatea este formată în mare parte din familii tinere și cupluri la prima locuință, iar atmosfera generală este una activă, cu multe servicii la pas — restaurante, cafenele, săli de fitness, farmacii, cabinete medicale.",
      },
    },
    {
      "@type": "Question",
      name: "Care sunt avantajele Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Avantajele principale sunt prețul accesibil pentru apartamente noi, infrastructura comercială completă (Auchan, Carrefour, Cora la câteva minute), apropierea de metroul Pacii, accesul rapid la Autostrada A1 și comunitatea tânără și activă. Apartamentele sunt finalizate, cu finisaje moderne și parcare proprie.",
      },
    },
    {
      "@type": "Question",
      name: "Care sunt dezavantajele Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cele mai frecvente nemulțumiri sunt traficul în orele de vârf pe Bulevardul Iuliu Maniu, lipsa unei stații de metrou chiar în cartier (cea mai apropiată, Pacii, este la 2 km), densitatea mare a blocurilor și faptul că administrativ ține de comuna Chiajna, nu de București. Aceste aspecte se compensează însă cu prețul foarte bun pe metru pătrat.",
      },
    },
    {
      "@type": "Question",
      name: "Este Militari Residence un loc bun pentru familii cu copii?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da. Cartierul are mai multe grădinițe private (Smart Kids, Happy Kids, Olga Gudynn), Școala Gimnazială nr. 1 Chiajna, locuri de joacă între blocuri și acces facil la parcurile Liniei și Militari. Comunitatea de familii tinere este unul dintre principalele motive pentru care zona este populară.",
      },
    },
    {
      "@type": "Question",
      name: "Merită să cumperi apartament în Militari Residence pentru investiție?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da, raportul preț de achiziție / chirie este unul dintre cele mai bune din Bucureștiului-vest. Apartamentele cu 2 camere se închiriază rapid datorită cererii constante din partea tinerilor profesioniști care lucrează în zona Politehnica, AFI sau care folosesc metroul Pacii.",
      },
    },
  ],
};
