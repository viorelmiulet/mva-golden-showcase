import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Complexe = lazy(() => import("@/pages/Complexe"));

export const Route = createFileRoute("/complexe/")({
  component: () => <Complexe />,
});
