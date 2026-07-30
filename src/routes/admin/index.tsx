import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));

export const Route = createFileRoute("/admin/")({
  component: () => <DashboardPage />,
});
