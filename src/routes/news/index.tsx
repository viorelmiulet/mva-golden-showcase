import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const News = lazy(() => import("@/pages/News"));

export const Route = createFileRoute("/news/")({
  component: () => <News />,
});
