import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { staticHead } from "@/lib/routeMeta";

const CalculatorCredit = lazy(() => import("@/pages/CalculatorCredit"));

export const Route = createFileRoute("/calculator-credit")({
  head: () =>
    staticHead({
      title: "Calculator credit ipotecar | MVA Imobiliare",
      description: "Calculează rata lunară, avansul și costul total al unui credit ipotecar pentru locuința dorită în București.",
      path: "/calculator-credit",
      image: "https://www.mvaimobiliare.ro/og-image.jpg?v=20260719c",
    }),
  component: () => <CalculatorCredit />,
});
