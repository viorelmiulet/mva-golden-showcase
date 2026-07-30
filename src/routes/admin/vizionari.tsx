import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ViewingAppointmentsPage = lazy(() => import("@/pages/admin/ViewingAppointmentsPage"));

export const Route = createFileRoute("/admin/vizionari")({
  component: () => <ViewingAppointmentsPage />,
});
