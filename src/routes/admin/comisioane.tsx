import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const CommissionsPage = lazy(() => import("@/pages/admin/CommissionsPage"));

export const Route = createFileRoute("/admin/comisioane")({
  component: () => <CommissionsPage />,
});
