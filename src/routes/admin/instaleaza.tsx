import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const InstallAppPage = lazy(() => import("@/pages/admin/InstallAppPage"));

export const Route = createFileRoute("/admin/instaleaza")({
  component: () => <InstallAppPage />,
});
