import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const DespreNoi = lazy(() => import("@/pages/DespreNoi"));

export const Route = createFileRoute("/despre-noi")({
  head: () =>
    staticHead({
      title: "Despre MVA Imobiliare | Agenție imobiliară în București",
      description: "Peste 10 ani de experiență în piața imobiliară din București. Consultanță completă pentru vânzare, cumpărare și închiriere.",
      path: "/despre-noi",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <DespreNoi />,
});
