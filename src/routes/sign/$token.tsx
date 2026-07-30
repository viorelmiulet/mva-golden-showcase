import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const SignContract = lazy(() => import("@/pages/SignContract"));

export const Route = createFileRoute("/sign/$token")({
  component: () => <SignContract />,
});
