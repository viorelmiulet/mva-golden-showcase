import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";
import { ro } from "@/translations/ro";

const FAQ = lazy(() => import("@/pages/FAQ"));

const SITE = "https://www.mvaimobiliare.ro";

const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: `${SITE}/faq`,
  mainEntity: ro.faq.items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

const breadcrumbJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Acasă", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Întrebări frecvente", item: `${SITE}/faq` },
  ],
});

export const Route = createFileRoute("/faq")({
  head: () => ({
    ...staticHead({
      title: "Întrebări frecvente imobiliare | MVA Imobiliare",
      description: "Răspunsuri la întrebările frecvente despre comisioane, acte, credite ipotecare și pașii unei tranzacții imobiliare în București.",
      path: "/faq",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
    scripts: [
      { type: "application/ld+json", children: faqJsonLd },
      { type: "application/ld+json", children: breadcrumbJsonLd },
    ],
  }),
  component: () => <FAQ />,
});
