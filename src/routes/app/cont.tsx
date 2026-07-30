import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobileAccount = lazy(() => import("@/pages/mobile/MobileAccount"));

export const Route = createFileRoute("/app/cont")({
  component: () => <MobileAccount />,
});
