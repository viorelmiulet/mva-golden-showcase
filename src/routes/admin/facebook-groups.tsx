import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const FacebookGroupsPage = lazy(() => import("@/pages/admin/FacebookGroupsPage"));

export const Route = createFileRoute("/admin/facebook-groups")({
  component: () => <FacebookGroupsPage />,
});
