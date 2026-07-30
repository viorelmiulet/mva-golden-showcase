import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const AuditLogsPage = lazy(() => import("@/pages/admin/AuditLogsPage"));

export const Route = createFileRoute("/admin/istoric")({
  component: () => <AuditLogsPage />,
});
