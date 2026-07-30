import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const CarteVizita = lazy(() => import("@/pages/CarteVizita"));

export const Route = createFileRoute("/carte-vizita")({
  component: () => <CarteVizita />,
});
