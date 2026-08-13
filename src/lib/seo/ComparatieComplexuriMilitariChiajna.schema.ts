const canonical = "https://www.mvaimobiliare.ro/comparatie-complexuri-militari-chiajna";

export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Comparație complexuri Militari & Chiajna 2026 — Militari Residence vs Eurocasa vs Renew Residence",
  description:
    "Comparație detaliată a celor mai populare ansambluri din zona Militari-Chiajna: prețuri, locuri de parcare, materiale de construcție, costuri de întreținere și facilități.",
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
      name: "Care complex din Militari are cele mai multe locuri de parcare?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Eurocasa Residence oferă cel mai bun raport apartamente/locuri de parcare (aproximativ 1:1 subteran), urmat de Renew Residence cu parcări supraterane și subterane. Militari Residence are parcare în general supraterană, suficientă dar mai aglomerată în orele de vârf.",
      },
    },
    {
      "@type": "Question",
      name: "Ce materiale de construcție folosesc complexele din Militari?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Toate cele trei complexe folosesc structură pe cadre din beton armat cu zidărie BCA. Renew Residence și Eurocasa folosesc termoizolație vată minerală de 10 cm și tâmplărie PVC cu geam termopan tristrat. Militari Residence folosește predominant polistiren expandat de 10 cm și termopan dublu stratificat.",
      },
    },
    {
      "@type": "Question",
      name: "Cât costă întreținerea într-un apartament din Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Întreținerea medie variază între 250-450 lei/lună pentru un apartament cu 2 camere, în funcție de complex și sezon. Eurocasa și Renew au costuri ușor mai mari (300-450 lei) datorită facilităților premium, iar Militari Residence se încadrează la 250-350 lei/lună.",
      },
    },
    {
      "@type": "Question",
      name: "Care complex are cel mai bun raport calitate-preț?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pentru investiție pură, Militari Residence oferă cele mai mici prețuri pe metru pătrat. Pentru locuit confortabil pe termen lung, Renew Residence și Eurocasa oferă un raport calitate-preț superior datorită finisajelor și facilităților incluse.",
      },
    },
  ],
};
