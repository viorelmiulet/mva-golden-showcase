import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const IntegrationsPage = lazy(() => import("@/pages/admin/IntegrationsPage"));

export const Route = createFileRoute("/admin/integrari")({
  component: () => <IntegrationsPage />,
});
