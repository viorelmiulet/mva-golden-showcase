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
  name: "get_property",
  title: "Detalii proprietate",
  description: "Returnează detaliile complete pentru o proprietate identificată prin slug.",
  inputSchema: {
    slug: z.string().min(1).describe("Slug-ul proprietății (ex: garsoniera-45mp-bucuresti-timisoara-439b)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const sb = client();
    const { data, error } = await sb
      .from("catalog_offers")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: `Eroare: ${error.message}` }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Proprietatea nu a fost găsită." }], isError: true };

    const url = `https://mvaimobiliare.ro/proprietati/${slug}`;
    return {
      content: [{ type: "text", text: JSON.stringify({ ...data, url }, null, 2) }],
      structuredContent: { property: data, url },
    };
  },
});
