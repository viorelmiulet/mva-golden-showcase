import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ExtensionPrivacyPolicy = lazy(() => import("@/pages/ExtensionPrivacyPolicy"));

export const Route = createFileRoute("/extensie-chrome-privacy")({
  component: () => <ExtensionPrivacyPolicy />,
});
