import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const FacebookQueuePage = lazy(() => import("@/pages/admin/FacebookQueuePage"));

export const Route = createFileRoute("/admin/facebook-queue")({
  component: () => <FacebookQueuePage />,
});
