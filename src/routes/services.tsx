import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/services")({
  beforeLoad: () => {
    throw redirect({ to: "/servicii", replace: true });
  },
});
