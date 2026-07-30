import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const VoiceAgentPage = lazy(() => import("@/pages/admin/VoiceAgentPage"));

export const Route = createFileRoute("/admin/agent-vocal")({
  component: () => <VoiceAgentPage />,
});
