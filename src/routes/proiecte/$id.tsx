import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));

export const Route = createFileRoute("/proiecte/$id")({
  component: () => <ProjectDetail />,
});
