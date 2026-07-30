import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const WatermarkPage = lazy(() => import("@/pages/admin/WatermarkPage"));

export const Route = createFileRoute("/admin/watermark")({
  component: () => <WatermarkPage />,
});
