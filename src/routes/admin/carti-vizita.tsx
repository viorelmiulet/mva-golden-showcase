import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const BusinessCardsPage = lazy(() => import("@/pages/admin/BusinessCardsPage"));

export const Route = createFileRoute("/admin/carti-vizita")({
  component: () => <BusinessCardsPage />,
});
