const canonical = "https://www.mvaimobiliare.ro/garsoniere-militari-residence";

export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Garsoniere Militari Residence — ghid complet de cumpărare, prețuri și investiție",
  description:
    "Ghid expert pentru cumpărarea unei garsoniere în Militari Residence: layout-uri tipice, prețuri actuale, randament la închiriere și cele mai bune unități disponibile.",
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
      name: "Cât costă o garsonieră în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Prețurile garsonierelor în Militari Residence pornesc de la aproximativ 55.000 € pentru unități de 30–35 mp utili și pot ajunge până la 75.000 € pentru garsoniere generoase, cu balcon, în blocurile noi sau cu vedere preferențială. Prețul mediu pe mp este de 1.700–2.000 €.",
      },
    },
    {
      "@type": "Question",
      name: "Care este suprafața tipică a unei garsoniere în Militari Residence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Majoritatea garsonierelor au între 30 și 45 mp utili. Layout-urile standard includ zonă de zi cu bucătărie deschisă, baie cu fereastră și balcon. Există și garsoniere duble (40–48 mp) cu separare clară între dormitor și living.",
      },
    },
    {
      "@type": "Question",
      name: "Este o garsonieră în Militari Residence o investiție bună?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da. Cererea de închiriere este constantă datorită proximității de stația de metrou Păcii, mall-ului AFI Cotroceni și universităților din zona Politehnica. Chiriile pentru garsoniere variază între 350 și 500 €/lună, ceea ce înseamnă un randament brut anual de 6–8%, peste media Bucureștiului.",
      },
    },
    {
      "@type": "Question",
      name: "Se poate cumpăra o garsonieră în Militari Residence cu Noua Casă?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Da, multe garsoniere din Militari Residence se încadrează în plafonul programului Noua Casă (până la 70.000 €). Avansul minim este de 5%, iar dezvoltatorul colaborează cu principalele bănci participante. Vezi ghidul complet Noua Casă 2024 pentru detalii.",
      },
    },
    {
      "@type": "Question",
      name: "Ce ar trebui să verific înainte de a cumpăra o garsonieră?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Verifică: etajul (etajele 3–7 sunt cele mai căutate la închiriere), orientarea (sud și est sunt preferate), prezența balconului, stadiul finisajelor, costurile lunare de întreținere, locul de parcare inclus sau opțional, și proximitatea de stația de metrou Păcii. Echipa MVA Imobiliare te poate ajuta cu o vizionare informată.",
      },
    },
  ],
};
