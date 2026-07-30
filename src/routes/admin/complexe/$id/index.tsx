import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ComplexDetailAdmin = lazy(() => import("@/pages/admin/ComplexDetail"));

export const Route = createFileRoute("/admin/complexe/$id/")({
  component: () => <ComplexDetailAdmin />,
});
