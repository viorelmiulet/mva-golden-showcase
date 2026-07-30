import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Cariera = lazy(() => import("@/pages/Cariera"));

export const Route = createFileRoute("/cariera")({
  component: () => <Cariera />,
});
