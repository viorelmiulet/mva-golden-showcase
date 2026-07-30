import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const BlogPost = lazy(() => import("@/pages/BlogPost"));

export const Route = createFileRoute("/blog/$slug")({
  component: () => <BlogPost />,
});
