import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ApiKeysAdmin = lazy(() => import("@/pages/ApiKeysAdmin"));

export const Route = createFileRoute("/api-keys")({
  component: () => <ApiKeysAdmin />,
});
