import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobileAppLayout = lazy(() => import("@/layouts/MobileAppLayout"));

export const Route = createFileRoute("/app")({
  component: () => <MobileAppLayout />,
});
