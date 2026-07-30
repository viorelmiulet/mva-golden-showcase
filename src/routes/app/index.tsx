import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const MobileHome = lazy(() => import("@/pages/mobile/MobileHome"));

export const Route = createFileRoute("/app/")({
  component: () => <MobileHome />,
});
