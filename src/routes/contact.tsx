import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const ContactPage = lazy(() => import("@/pages/ContactPage"));

export const Route = createFileRoute("/contact")({
  component: () => <ContactPage />,
});
