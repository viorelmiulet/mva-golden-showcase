import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/oferte")({
  beforeLoad: () => {
    throw redirect({ to: "/proprietati", replace: true });
  },
});
