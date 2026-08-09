import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const idSchema = z.object({ propertyId: z.string().uuid() });

/** Called client-side after hydration — never from a loader (crawlers must not count). */
export const recordPropertyView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const { recordView } = await import("./propertyViews.server");
    const request = getRequest();
    return recordView(data.propertyId, request.headers);
  });

export const getPropertyViewCounts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const { countsForProperty } = await import("./propertyViews.server");
    return countsForProperty(data.propertyId);
  });

export const getAllPropertyViewCounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { countsForAllProperties } = await import("./propertyViews.server");
    return countsForAllProperties();
  },
);
