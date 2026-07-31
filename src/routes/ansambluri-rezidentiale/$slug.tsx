import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy singular/alias complex URL → canonical /complexe/{slug} (301). */
export const Route = createFileRoute("/ansambluri-rezidentiale/$slug")({
  beforeLoad: ({ params, location }) => {
    throw redirect({
      href: `/complexe/${params.slug}${location.searchStr || ""}`,
      statusCode: 301,
    });
  },
});
