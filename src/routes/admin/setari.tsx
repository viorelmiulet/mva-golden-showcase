import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));

export const Route = createFileRoute("/admin/setari")({
  component: () => <SettingsPage />,
});
