import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobileComplexes = lazy(() => import("@/pages/mobile/MobileComplexes"));

export const Route = createFileRoute("/app/complexe")({
  component: () => <MobileComplexes />,
});
