import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";
import { CHIRII_MILITARI_FAQ } from "@/lib/chiriiMilitariFaq";

const ChiriiMilitariResidence = lazy(
  () => import("@/pages/ChiriiMilitariResidence"),
);

const CANONICAL = "https://www.mvaimobiliare.ro/chirii-militari-residence";

export const Route = createFileRoute("/chirii-militari-residence")({
  head: () => {
    const base = staticHead({
      title: "Chirii Militari Residence 2026 — prețuri și ghid chiriași | MVA",
      description:
        "Cât costă chiria în Militari Residence: 300–420 € garsonieră, 400–550 € la 2 camere. Costuri de întreținere, acte, garanție, sfaturi pentru chiriași și facilități.",
      path: "/chirii-militari-residence",
      image: "https://www.mvaimobiliare.ro/og-image.jpg",
      ogType: "article",
    });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "Chirii Militari Residence — prețuri, sfaturi pentru chiriași și facilități",
            description:
              "Ghid complet despre închirierea unui apartament în Militari Residence: prețuri actuale, costuri lunare, acte necesare și facilitățile ansamblului.",
            inLanguage: "ro-RO",
            author: { "@type": "Organization", name: "MVA Imobiliare" },
            publisher: {
              "@type": "Organization",
              name: "MVA Imobiliare",
              logo: {
                "@type": "ImageObject",
                url: "https://www.mvaimobiliare.ro/mva-logo-luxury-horizontal.svg",
              },
            },
            mainEntityOfPage: CANONICAL,
            image: "https://www.mvaimobiliare.ro/og-image.jpg",
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: CHIRII_MILITARI_FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  component: () => <ChiriiMilitariResidence />,
});
