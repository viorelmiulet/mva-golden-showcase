import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const EmailMonitorPage = lazy(() => import("@/pages/admin/EmailMonitorPage"));

export const Route = createFileRoute("/admin/monitorizare-email")({
  component: () => <EmailMonitorPage />,
});
