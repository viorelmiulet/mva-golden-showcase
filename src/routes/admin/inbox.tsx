import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const InboxPage = lazy(() => import("@/pages/admin/InboxPage"));

export const Route = createFileRoute("/admin/inbox")({
  component: () => <InboxPage />,
});
