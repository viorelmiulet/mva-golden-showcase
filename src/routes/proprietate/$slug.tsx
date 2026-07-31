import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy singular URL → canonical /proprietati/{slug} (301, query string preserved). */
export const Route = createFileRoute("/proprietate/$slug")({
  beforeLoad: ({ params, location }) => {
    throw redirect({
      href: `/proprietati/${params.slug}${location.searchStr || ""}`,
      statusCode: 301,
    });
  },
});
