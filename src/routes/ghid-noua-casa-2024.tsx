import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import { articleSchema, faqSchema } from "@/lib/seo/GhidNouaCasa2024.schema";

const GhidNouaCasa2024 = lazy(() => import("@/pages/GhidNouaCasa2024"));

export const Route = createFileRoute("/ghid-noua-casa-2024")({
  head: () =>
    editorialHead({
      title: "Ghid Noua Casă 2024 — condiții, acte și bănci participante | MVA Imobiliare",
      description:
        "Ghid complet al programului Noua Casă 2024: cine este eligibil, ce acte sunt necesare, care sunt băncile participante și cum obții un credit garantat de stat pentru prima locuință în București.",
      keywords:
        "noua casa, programul noua casa 2024, credit noua casa, conditii noua casa, banci participante noua casa, avans noua casa, acte necesare noua casa, prima casa 2024, credit prima locuinta, ipotecar noua casa",
      path: "/ghid-noua-casa-2024",
      ogType: "article",
      ogTitle: "Ghid Noua Casă 2024 — condiții, acte și bănci participante",
      ogDescription:
        "Află totul despre programul Noua Casă 2024: eligibilitate, acte necesare, bănci participante și cum obții creditul pentru prima locuință.",
      image: "https://www.mvaimobiliare.ro/og-image.jpg",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <GhidNouaCasa2024 />,
});
