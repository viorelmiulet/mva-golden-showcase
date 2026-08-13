const canonical = "https://www.mvaimobiliare.ro/ghid-militari-residence";

export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Ghid complet Militari Residence 2026 — cartier, prețuri, transport, școli și viață",
  description:
    "Ghid complet despre Militari Residence: locație, transport STB și metrou, școli, magazine, parcuri, prețuri apartamente și sfaturi pentru cumpărători.",
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
      name: "Unde este Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari Residence se află în comuna Chiajna, județul Ilfov, la granița directă cu Sectorul 6 din București, în zona de vest a Capitalei, la aproximativ 2 km de stația de metrou Pacii.",
      },
    },
    {
      "@type": "Question",
      name: "Cât costă un apartament în Militari Residence în 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "În 2026, prețurile pornesc de la aproximativ 50.000€ pentru garsoniere, 70.000–90.000€ pentru apartamente cu 2 camere și 95.000–130.000€ pentru cele cu 3 camere, în funcție de bloc, etaj și finisaje.",
      },
    },
    {
      "@type": "Question",
      name: "Cum ajungi din Militari Residence în centrul Bucureștiului?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cu mașina pe Autostrada A1 și Bulevardul Iuliu Maniu durează 20–30 de minute. Cu transportul în comun, autobuzele STB 178, 278 și 336 conectează cartierul cu stația de metrou Pacii (M3), de unde ajungi în Piața Unirii în circa 20 de minute.",
      },
    },
    {
      "@type": "Question",
      name: "Sunt școli și grădinițe în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da. În cartier funcționează Școala Gimnazială nr. 1 Chiajna, mai multe grădinițe private (Smart Kids, Happy Kids, Olga Gudynn) și creșe particulare. Liceele importante din Sectorul 6 sunt la 10–15 minute distanță.",
      },
    },
    {
      "@type": "Question",
      name: "Merită să cumperi în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da, pentru raportul preț/suprafață imbatabil în vestul Bucureștiului, infrastructură comercială completă (Auchan, Carrefour, Cora la câțiva pași) și acces rapid la metroul Pacii. Este o alegere potrivită pentru prima locuință și pentru investiție în închiriere.",
      },
    },
  ],
};
