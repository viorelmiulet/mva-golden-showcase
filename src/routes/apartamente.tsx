import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/apartamente")({
  beforeLoad: () => {
    throw redirect({ to: "/proprietati", replace: true });
  },
});
