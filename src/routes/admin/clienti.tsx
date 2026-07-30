import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ClientsAdminPage = lazy(() => import("@/pages/admin/ClientsAdminPage"));

export const Route = createFileRoute("/admin/clienti")({
  component: () => <ClientsAdminPage />,
});
