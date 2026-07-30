import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const CalculatorCredit = lazy(() => import("@/pages/CalculatorCredit"));

export const Route = createFileRoute("/calculator-credit")({
  component: () => <CalculatorCredit />,
});
