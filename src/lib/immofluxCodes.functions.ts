import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ImmofluxCodeRow = {
  code: number;
  group_key: string;
  group_label: string;
  label: string | null;
  source: string;
  first_seen: string;
  usage_count: number;
};

/** Lists all vendor codes with how many properties use each one. */
export const listImmofluxCodes = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ codes: ImmofluxCodeRow[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: codes, error }, { data: offers }] = await Promise.all([
      supabaseAdmin
        .from("immoflux_codes")
        .select("code, group_key, group_label, label, source, first_seen")
        .order("code"),
      supabaseAdmin.from("catalog_offers").select("source_codes").eq("crm_source", "immoflux"),
    ]);
    if (error) throw new Error(error.message);

    const usage = new Map<string, number>();
    for (const row of offers ?? []) {
      const raw = (row as { source_codes: { raw?: Record<string, string[]> } | null }).source_codes?.raw;
      if (!raw) continue;
      const seen = new Set(Object.values(raw).flat().map(String));
      for (const c of seen) usage.set(c, (usage.get(c) ?? 0) + 1);
    }

    const rows: ImmofluxCodeRow[] = (codes ?? []).map((c) => ({
      ...(c as Omit<ImmofluxCodeRow, "usage_count">),
      usage_count: usage.get(String(c.code)) ?? 0,
    }));

    // Unmapped first (most used first), then everything else by code.
    rows.sort((a, b) => {
      const aUn = !a.label ? 0 : 1;
      const bUn = !b.label ? 0 : 1;
      if (aUn !== bUn) return aUn - bUn;
      if (aUn === 0 && b.usage_count !== a.usage_count) return b.usage_count - a.usage_count;
      return a.code - b.code;
    });

    return { codes: rows };
  },
);

const updateSchema = z.object({
  code: z.number().int(),
  label: z.string().trim().max(120).nullable(),
  group_label: z.string().trim().min(1).max(80).optional(),
});

/** Names (or renames) a vendor code from the admin UI — no code change needed. */
export const updateImmofluxCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const label = data.label && data.label.length > 0 ? data.label : null;
    const patch: { label: string | null; source: string; group_label?: string } = {
      label,
      source: label ? "manual" : "unmapped",
    };
    if (data.group_label) patch.group_label = data.group_label;

    const { error } = await supabaseAdmin.from("immoflux_codes").update(patch).eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
