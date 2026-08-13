import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import {
  articleSchema,
  faqSchema,
} from "@/lib/seo/ComparatieComplexuriMilitariChiajna.schema";

const ComparatieComplexuriMilitariChiajna = lazy(() => import("@/pages/ComparatieComplexuriMilitariChiajna"));

export const Route = createFileRoute("/comparatie-complexuri-militari-chiajna")({
  head: () =>
    editorialHead({
      title: "Comparație Militari Residence vs Eurocasa vs Renew 2026",
      description:
        "Comparație detaliată a complexurilor din Militari-Chiajna: Militari Residence, Eurocasa și Renew. Prețuri, parcare, materiale, întreținere. Alege informat.",
      keywords:
        "militari residence, comparatie complexuri militari, eurocasa vs renew, apartamente militari chiajna, complex rezidential militari",
      path: "/comparatie-complexuri-militari-chiajna",
      ogType: "article",
      ogTitle:
        "Comparație complexuri Militari & Chiajna — Militari Residence vs Eurocasa vs Renew",
      ogDescription:
        "Tabel comparativ: prețuri, parcare, materiale, întreținere pentru cele mai populare ansambluri din zona Militari-Chiajna.",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <ComparatieComplexuriMilitariChiajna />,
});
