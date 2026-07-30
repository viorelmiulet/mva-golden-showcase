import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const PoliticaConfidentialitate = lazy(() => import("@/pages/PoliticaConfidentialitate"));

export const Route = createFileRoute("/politica-confidentialitate")({
  component: () => <PoliticaConfidentialitate />,
});
