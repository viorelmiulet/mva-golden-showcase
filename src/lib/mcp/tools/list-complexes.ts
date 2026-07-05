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
  name: "list_complexes",
  title: "Listă ansambluri rezidențiale",
  description: "Returnează ansamblurile rezidențiale (complexuri) disponibile în catalog.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).nullable().describe("Număr maxim rezultate (default 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const sb = client();
    const { data, error } = await sb
      .from("projects")
      .select("id, name, location, description, status, slug")
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: `Eroare: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { complexes: data ?? [] },
    };
  },
});
