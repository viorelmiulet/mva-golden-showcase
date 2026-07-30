import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MarketingAIPage = lazy(() => import("@/pages/admin/MarketingAIPage"));

export const Route = createFileRoute("/admin/marketing-ai")({
  component: () => <MarketingAIPage />,
});
