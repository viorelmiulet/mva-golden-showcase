import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ComplexesOverview = lazy(() => import("@/pages/admin/ComplexesOverview"));

export const Route = createFileRoute("/admin/complexe/")({
  component: () => <ComplexesOverview />,
});
