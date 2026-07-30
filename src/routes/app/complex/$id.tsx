import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobileComplexDetail = lazy(() => import("@/pages/mobile/MobileComplexDetail"));

export const Route = createFileRoute("/app/complex/$id")({
  component: () => <MobileComplexDetail />,
});
