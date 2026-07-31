import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const CosturiTranzactieImobiliara = lazy(() => import("@/pages/CosturiTranzactieImobiliara"));

export const Route = createFileRoute("/costuri-tranzactie-imobiliara")({
  head: () =>
    staticHead({
      title: "Costurile unei tranzacții imobiliare | Ghid MVA Imobiliare",
      description: "Notar, taxe, intabulare, comision și costuri ascunse: cât plătești în realitate la cumpărarea unei locuințe în București.",
      path: "/costuri-tranzactie-imobiliara",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <CosturiTranzactieImobiliara />,
});
