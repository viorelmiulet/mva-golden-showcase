import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const EurocasaResidence = lazy(() => import("@/pages/EurocasaResidence"));

export const Route = createFileRoute("/eurocasa-residence")({
  component: () => <EurocasaResidence />,
});
