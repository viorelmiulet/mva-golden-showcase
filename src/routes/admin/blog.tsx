import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const BlogAdminPage = lazy(() => import("@/pages/admin/BlogAdminPage"));

export const Route = createFileRoute("/admin/blog")({
  component: () => <BlogAdminPage />,
});
