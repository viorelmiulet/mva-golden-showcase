import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const PropertyViewsPage = lazy(() => import("@/pages/admin/PropertyViewsPage"));

export const Route = createFileRoute("/admin/vizualizari-proprietati")({
  component: () => <PropertyViewsPage />,
});
