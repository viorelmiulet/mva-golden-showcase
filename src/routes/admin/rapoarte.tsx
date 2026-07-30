import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ReportsPage = lazy(() => import("@/pages/admin/ReportsPage"));

export const Route = createFileRoute("/admin/rapoarte")({
  component: () => <ReportsPage />,
});
