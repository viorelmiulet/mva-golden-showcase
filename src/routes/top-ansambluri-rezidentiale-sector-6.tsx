import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { editorialHead } from "@/lib/routeMeta";
import {
  articleSchema,
  faqSchema,
} from "@/lib/seo/TopAnsambluriRezidentialeSector6.schema";

const TopAnsambluriRezidentialeSector6 = lazy(() => import("@/pages/TopAnsambluriRezidentialeSector6"));

export const Route = createFileRoute("/top-ansambluri-rezidentiale-sector-6")({
  head: () =>
    editorialHead({
      title: "Top Ansambluri Rezidențiale Sector 6 — comparatie 2026 | MVA Imobiliare",
      description:
        "Comparație detaliată a ansamblurilor din Sector 6: Militari Residence, Eurocasa, Renew, Plaza și 21 Residence. Prețuri, metrou, facilități și transport public.",
      keywords:
        "apartamente sector 6, apartamente de vanzare bucuresti sector 6, ansambluri rezidentiale sector 6, militari residence, eurocasa, renew residence",
      path: "/top-ansambluri-rezidentiale-sector-6",
      ogType: "article",
      ogTitle: "Top Ansambluri Rezidențiale Sector 6 — comparatie 2026",
      ogDescription:
        "Tabel comparativ: prețuri, metrou, facilități pentru cele mai populare complexuri din Sector 6 și zona Militari-Chiajna.",
      schemas: [articleSchema, faqSchema],
    }),
  component: () => <TopAnsambluriRezidentialeSector6 />,
});
