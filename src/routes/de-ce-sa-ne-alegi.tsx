import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const WhyChooseUs = lazy(() => import("@/pages/WhyChooseUs"));

export const Route = createFileRoute("/de-ce-sa-ne-alegi")({
  component: () => <WhyChooseUs />,
});
