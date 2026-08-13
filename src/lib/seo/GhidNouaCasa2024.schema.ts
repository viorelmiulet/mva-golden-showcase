export const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Ghid complet Noua Casă 2024 — condiții, acte necesare și bănci participante",
  description:
    "Află totul despre programul Noua Casă 2024: cine este eligibil, ce acte sunt necesare, care sunt băncile participante și cum obții un credit garantat de stat pentru prima locuință.",
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
      name: "Ce este programul Noua Casă?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Noua Casă este un program guvernamental românesc care susține achiziția primei locuințe prin credite ipotecare cu garanție de stat. Statul garantează o parte din credit, ceea ce permite băncilor să ofere condiții mai avantajoase: avans redus (de la 5%), dobânzi mai mici și termene mai lungi de rambursare (până la 30 de ani).",
      },
    },
    {
      "@type": "Question",
      name: "Cine este eligibil pentru programul Noua Casă 2024?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sunt eligibile persoanele fizice care nu dețin nicio locuință sau dețin o locuință mai mică de 50 mp și vor să-și achiziționeze una nouă. Vârsta maximă la finalizarea creditului este de 70 de ani. Tinerii sub 35 de ani, familiile cu copii și angajații din sistemul public pot beneficia de condiții preferențiale sau avans redus.",
      },
    },
    {
      "@type": "Question",
      name: "Cât este avansul la Noua Casă?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Avansul minim pentru programul Noua Casă este de 5% din prețul de achiziție al locuinței. Pentru anumite categorii (tineri sub 35 de ani, familii cu copii), avansul poate fi redus la 0% în anumite condiții, în funcție de banca aleasă și de politica FNGCIMM.",
      },
    },
    {
      "@type": "Question",
      name: "Care este plafonul maxim de finanțare la Noua Casă?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plafonul maxim de finanțare prin programul Noua Casă este de aproximativ 500.000 RON (cca. 100.000 EUR) pentru locuințe obișnuite. Pentru locuințe eficiente energetic (clasa A sau B), plafonul poate crește până la aproximativ 700.000 RON (cca. 140.000 EUR). Suma exactă variază în funcție de anul programului și de legislația în vigoare.",
      },
    },
    {
      "@type": "Question",
      name: "Ce acte sunt necesare pentru creditul Noua Casă?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Actele necesare includ: actul de identitate, adeverință de venit de la angajator sau declarații de venit pentru PFA/liber profesioniști, extras de cont, certificat de căsătorie (dacă e cazul), declarație pe proprie răspundere că nu deții alte locuințe, actele imobilului (carte funciară, contract de vânzare-cumpărare în formă preliminară), și documentația specifică solicitată de bancă.",
      },
    },
    {
      "@type": "Question",
      name: "Ce bănci participă în programul Noua Casă 2024?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Principalele bănci participante în programul Noua Casă includ: BCR, BRD, Raiffeisen Bank, ING, Banca Transilvania, OTP Bank, UniCredit Bank, CEC Bank și Alpha Bank. Fiecare bancă oferă propriile condiții de dobândă, comisioane și perioadă de grație. Este recomandat să compari ofertele mai multor bănci înainte de a alege.",
      },
    },
  ],
};
