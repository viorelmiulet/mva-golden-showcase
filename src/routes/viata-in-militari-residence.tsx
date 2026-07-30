import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ViataInMilitariResidence = lazy(() => import("@/pages/ViataInMilitariResidence"));

export const Route = createFileRoute("/viata-in-militari-residence")({
  component: () => <ViataInMilitariResidence />,
});
