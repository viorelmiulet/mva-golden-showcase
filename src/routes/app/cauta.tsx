import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobileSearch = lazy(() => import("@/pages/mobile/MobileSearch"));

export const Route = createFileRoute("/app/cauta")({
  component: () => <MobileSearch />,
});
