import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const PropertiesPage = lazy(() => import("@/pages/admin/PropertiesPage"));

export const Route = createFileRoute("/admin/proprietati")({
  component: () => <PropertiesPage />,
});
