import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const CosturiTranzactieImobiliara = lazy(() => import("@/pages/CosturiTranzactieImobiliara"));

export const Route = createFileRoute("/costuri-tranzactie-imobiliara")({
  component: () => <CosturiTranzactieImobiliara />,
});
