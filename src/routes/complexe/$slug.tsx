import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ComplexDetailPublic = lazy(() => import("@/pages/ComplexDetail"));

export const Route = createFileRoute("/complexe/$slug")({
  component: () => <ComplexDetailPublic />,
});
