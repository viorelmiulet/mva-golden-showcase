import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobilePropertyDetail = lazy(() => import("@/pages/mobile/MobilePropertyDetail"));

export const Route = createFileRoute("/app/proprietate/$slug")({
  component: () => <MobilePropertyDetail />,
});
