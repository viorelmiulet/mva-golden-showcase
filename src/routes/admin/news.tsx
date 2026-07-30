import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const NewsAdminPage = lazy(() => import("@/pages/admin/NewsAdminPage"));

export const Route = createFileRoute("/admin/news")({
  component: () => <NewsAdminPage />,
});
