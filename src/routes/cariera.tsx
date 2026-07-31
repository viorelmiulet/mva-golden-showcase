import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const Cariera = lazy(() => import("@/pages/Cariera"));

export const Route = createFileRoute("/cariera")({
  head: () =>
    staticHead({
      title: "Carieră la MVA Imobiliare | Agent imobiliar București",
      description: "Alătură-te echipei MVA Imobiliare: training, portofoliu de clienți și comisioane motivante pentru agenți în București.",
      path: "/cariera",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <Cariera />,
});
