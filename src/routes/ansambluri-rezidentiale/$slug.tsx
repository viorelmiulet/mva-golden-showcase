import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const NavigateToComplex = lazy(() => import("@/components/NavigateToComplex"));

export const Route = createFileRoute("/ansambluri-rezidentiale/$slug")({
  component: () => <NavigateToComplex />,
});
