export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Top Ansambluri Rezidențiale Sector 6 — comparatie 2026: Militari, Chiajna și zonele învecinate",
  description:
    "Comparație detaliată a celor mai populare ansambluri rezidențiale din Sector 6 București: Militari Residence, Eurocasa, Renew, Plaza și 21 Residence. Prețuri, transport, facilități.",
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
      name: "Care sunt cele mai bune ansambluri rezidențiale din Sector 6?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cele mai populare ansambluri din Sector 6 și zona învecinată (Chiajna) sunt: Militari Residence — cel mai mare și mai accesibil; Eurocasa Residence — raport calitate-preț echilibrat; Renew Residence — confort premium; Plaza Residence — poziționare excelentă lângă metrou; și 21 Residence — unități compacte pentru investiție.",
      },
    },
    {
      "@type": "Question",
      name: "Cât costă un apartament cu 2 camere în Sector 6?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "În 2026, prețul unui apartament cu 2 camere în Sector 6 variază între 65.000 și 110.000 € în funcție de complex, etaj, orientare și finisaje. Complexurile din Chiajna (Militari Residence, Eurocasa) pornesc de la 65.000–80.000 €, iar cele din Militari propriu-zis (Renew, Plaza) ajung la 85.000–110.000 €.",
      },
    },
    {
      "@type": "Question",
      name: "Ce metrou deservește zona Sector 6?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sectorul 6 este deservit de Magistrala M3 (Păcii, Gorjului, Lujerului). Stația Păcii este cea mai apropiată de complexurile din Militari și Chiajna. Se lucrează la extinderea metroului către zona Roșu–Chiajna, ceea ce va crește accesibilitatea și valoarea imobilelor.",
      },
    },
    {
      "@type": "Question",
      name: "Este mai bine să cumpăr în Militari sau în Chiajna?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Militari (București) oferă acces mai rapid la metrou, școli și centre comerciale, dar prețuri mai mari. Chiajna (Ilfov) oferă apartamente mai spațioase la prețuri cu 15–25% mai mici, cu acces rapid la autostradă. Alegerea depinde de buget și priorități: naveta zilnică favorizează Militari, iar spațiul și bugetul favorizează Chiajna.",
      },
    },
    {
      "@type": "Question",
      name: "Ce complex din Sector 6 are cel mai bun raport calitate-preț?",
      acceptedAnswer: {
        "@type": "Answer",
        "text": "Pentru raport calitate-preț, Eurocasa Residence și Militari Residence sunt cele mai apreciate. Eurocasa oferă finisaje superioare și parcare subterană la prețuri moderate, în timp ce Militari Residence rămâne cea mai accesibilă intrare în piață pentru primii cumpărători.",
      },
    },
  ],
};
