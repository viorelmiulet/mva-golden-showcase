const canonical = "https://www.mvaimobiliare.ro/pareri-militari-residence";
const overallRating = 4.2;

export const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "Review",
  itemReviewed: {
    "@type": "ApartmentComplex",
    name: "Militari Residence",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Chiajna",
      addressRegion: "Ilfov",
      addressCountry: "RO",
    },
  },
  author: { "@type": "Organization", name: "MVA Imobiliare" },
  publisher: { "@type": "Organization", name: "MVA Imobiliare" },
  datePublished: "2026-01-15",
  reviewRating: {
    "@type": "Rating",
    ratingValue: overallRating,
    bestRating: 5,
    worstRating: 1,
  },
  reviewBody:
    "Militari Residence rămâne în 2026 unul dintre cele mai populare complexuri rezidențiale din vestul Bucureștiului, cu un raport preț/calitate foarte bun, comunitate activă și infrastructură comercială completă. Punctele slabe rămân traficul și lipsa metroului în cartier.",
};

export const aggregateSchema = {
  "@context": "https://schema.org",
  "@type": "ApartmentComplex",
  name: "Militari Residence",
  url: canonical,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: overallRating,
    reviewCount: 138,
    bestRating: 5,
    worstRating: 1,
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Ce păreri au locuitorii despre Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Majoritatea locuitorilor apreciază raportul preț/calitate, infrastructura comercială completă (Auchan, Carrefour, Cora la câteva minute) și comunitatea tânără și activă. Nemulțumirile țin în principal de trafic la orele de vârf pe Iuliu Maniu și de lipsa unei stații de metrou chiar în cartier.",
      },
    },
    {
      "@type": "Question",
      name: "Merită să cumperi apartament în Militari Residence în 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da, dacă prioritatea este un apartament nou la preț accesibil, cu acces rapid la magazine, școli și autostrada A1. Prețul mediu este cu 20–30% sub media pieței pentru apartamente noi din București, iar chiria se rentabilizează în 12–14 ani, unul dintre cele mai bune randamente din zona metropolitană.",
      },
    },
    {
      "@type": "Question",
      name: "Care este calitatea construcției în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Calitatea este medie–bună, tipică pentru dezvoltările de volum din perioada 2015–2024: structură pe cadre din beton armat, izolație termică conformă standardelor, ferestre termopan cu geam dublu. Blocurile mai noi (fazele Militari Residence 3, 4, RENEW Residence) au finisaje superioare față de fazele inițiale.",
      },
    },
    {
      "@type": "Question",
      name: "Este Militari Residence sigur?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da. Fiecare bloc are pază proprie, camere de supraveghere pe holuri și în parcări subterane, iar cartierul are lumină bună pe timp de noapte. Rata infracționalității raportată la Poliția Chiajna este scăzută, comparabilă cu zonele rezidențiale medii din București.",
      },
    },
    {
      "@type": "Question",
      name: "Cât durează să ajungi din Militari Residence în centrul Bucureștiului?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cu mașina în afara orelor de vârf: 20–25 minute până la Piața Unirii. Cu metroul (stația Pacii, la 2 km): aproximativ 35 minute până în centru. La orele de vârf, cu mașina, timpul poate ajunge la 45–60 minute.",
      },
    },
    {
      "@type": "Question",
      name: "Care sunt cele mai frecvente reclamații despre Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cele mai frecvente reclamații sunt: traficul pe bulevardul Iuliu Maniu la orele de vârf, densitatea mare a blocurilor, spațiul verde limitat între clădiri și faptul că administrativ ține de comuna Chiajna, nu de Municipiul București.",
      },
    },
  ],
};
