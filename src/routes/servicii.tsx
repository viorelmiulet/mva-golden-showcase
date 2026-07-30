import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Servicii = lazy(() => import("@/pages/Servicii"));

export const Route = createFileRoute("/servicii")({
  component: () => <Servicii />,
});
