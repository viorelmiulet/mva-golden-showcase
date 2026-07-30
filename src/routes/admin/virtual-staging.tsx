import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const VirtualStagingPage = lazy(() => import("@/pages/admin/VirtualStagingPage"));

export const Route = createFileRoute("/admin/virtual-staging")({
  component: () => <VirtualStagingPage />,
});
