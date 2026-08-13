export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Militari Residence vs. Chiajna 2026 — comparație prețuri, transport, școli și stil de viață",
  description:
    "Comparație detaliată Militari Residence vs. Chiajna: preț pe metru pătrat, apropierea de metrou, școli, infrastructură și calitatea vieții. Află care zonă ți se potrivește.",
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
      name: "Militari Residence este în București sau în Chiajna?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence este situat administrativ în comuna Chiajna, județul Ilfov, dar se află la granița directă cu Sectorul 6 al Bucureștiului, la doar 2 km de stația de metrou Pacii.",
      },
    },
    {
      "@type": "Question",
      name: "Care zonă are prețuri mai mici, Militari Residence sau Chiajna?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "În 2026, prețul mediu în Militari Residence este 1.450–1.700 €/mp, iar în restul comunei Chiajna (Roșu, Dudu, centru) prețurile pornesc de la 1.150–1.400 €/mp pentru apartamente noi. Chiajna este cu 15–25% mai accesibilă, dar Militari Residence oferă infrastructură mai dezvoltată.",
      },
    },
    {
      "@type": "Question",
      name: "Cum ajung de la Chiajna la metrou?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Din Militari Residence ajungi la metrou Pacii (M3) în 10–15 minute cu autobuzele STB 178, 278 sau 336. Din restul Chiajnei (Roșu, Dudu) timpul de transport este de 25–40 de minute, în funcție de trafic.",
      },
    },
    {
      "@type": "Question",
      name: "Există școli și grădinițe în Militari Residence și Chiajna?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence are școala generală nouă „Militari Residence”, grădinițe private și acces rapid la Liceul Tudor Vladimirescu. Comuna Chiajna are școli publice în Roșu și Dudu, plus mai multe grădinițe private. Pentru licee și facultăți, ambele zone depind de Sectorul 6.",
      },
    },
    {
      "@type": "Question",
      name: "Ce zonă recomandați pentru familiile cu copii?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence este preferat de familii pentru densitatea de servicii (școli, supermarketuri, parcuri, clinici). Chiajna (Roșu, Dudu) este mai potrivită celor care vor case sau apartamente mai mari la preț mai mic, dar cu drum mai lung către serviciile din oraș.",
      },
    },
  ],
};
