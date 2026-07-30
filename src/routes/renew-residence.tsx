import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const RenewResidence = lazy(() => import("@/pages/RenewResidence"));

export const Route = createFileRoute("/renew-residence")({
  component: () => <RenewResidence />,
});
