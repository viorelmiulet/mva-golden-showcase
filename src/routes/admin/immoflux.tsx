import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ImmofluxDashboard = lazy(() => import("@/pages/admin/ImmofluxDashboard"));

export const Route = createFileRoute("/admin/immoflux")({
  component: () => <ImmofluxDashboard />,
});
