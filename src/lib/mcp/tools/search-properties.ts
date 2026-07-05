import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export default defineTool({
  name: "search_properties",
  title: "Caută proprietăți",
  description:
    "Caută proprietăți imobiliare din catalogul MVA Imobiliare. Filtre opționale: număr camere, preț min/max EUR, locație (text), doar recomandate.",
  inputSchema: {
    rooms: z.number().int().min(1).max(10).nullable().describe("Număr de camere"),
    min_price: z.number().min(0).nullable().describe("Preț minim EUR"),
    max_price: z.number().min(0).nullable().describe("Preț maxim EUR"),
    location: z.string().nullable().describe("Text căutat în locație (ex: Militari)"),
    featured_only: z.boolean().nullable().describe("Doar oferte recomandate"),
    limit: z.number().int().min(1).max(50).nullable().describe("Număr maxim rezultate (default 10)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ rooms, min_price, max_price, location, featured_only, limit }) => {
    const sb = client();
    let q = sb
      .from("catalog_offers")
      .select("id, title, location, city, zone, price_min, price_max, rooms, surface_min, surface_max, currency, is_featured, slug, availability_status")
      .eq("availability_status", "available")
      .limit(limit ?? 10);

    if (rooms) q = q.eq("rooms", rooms);
    if (min_price) q = q.gte("price_min", min_price);
    if (max_price) q = q.lte("price_min", max_price);
    if (location) q = q.ilike("location", `%${location}%`);
    if (featured_only) q = q.eq("is_featured", true);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: `Eroare: ${error.message}` }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { properties: data ?? [], count: data?.length ?? 0 },
    };
  },
});
