/**
 * Immoflux code resolution.
 *
 * The vendor sends numeric codes (e.g. 30301) in several fields. The published
 * documentation is incomplete, so labels live in the `immoflux_codes` table and
 * are editable from /admin/immoflux-codes. Unknown codes are recorded with
 * source='unmapped' and a NULL label, and are never rendered in the UI.
 */

export type CodeEntry = {
  code: number;
  group_key: string;
  group_label: string;
  label: string | null;
  source: string;
};

export type CodeMap = Map<string, CodeEntry>;

/** Numeric prefix (first 3 digits) → group. Mirrors the vendor's code ranges. */
export const GROUP_BY_PREFIX: Record<string, { key: string; label: string }> = {
  "100": { key: "utilitati", label: "Utilități" },
  "101": { key: "incalzire", label: "Sistem încălzire" },
  "102": { key: "climatizare", label: "Climatizare" },
  "103": { key: "teren", label: "Teren" },
  "200": { key: "izolatie", label: "Izolație" },
  "201": { key: "pereti", label: "Pereți" },
  "202": { key: "podele", label: "Podele" },
  "203": { key: "stare", label: "Stare finisaje" },
  "204": { key: "ferestre", label: "Ferestre" },
  "205": { key: "jaluzele", label: "Jaluzele" },
  "206": { key: "rulouri", label: "Rulouri" },
  "207": { key: "usa_intrare", label: "Ușă intrare" },
  "208": { key: "iluminat", label: "Iluminat" },
  "209": { key: "usi_interior", label: "Uși interior" },
  "210": { key: "acoperis", label: "Acoperiș" },
  "300": { key: "spatii", label: "Spații" },
  "301": { key: "bucatarie", label: "Bucătărie" },
  "302": { key: "contorizare", label: "Contorizare" },
  "303": { key: "mobilat", label: "Mobilat" },
  "304": { key: "imobil", label: "Imobil" },
  "305": { key: "electrocasnice", label: "Electrocasnice" },
  "306": { key: "diverse", label: "Diverse" },
};

export function groupForCode(code: string | number): { key: string; label: string } {
  const s = String(code);
  return GROUP_BY_PREFIX[s.slice(0, 3)] ?? { key: "altele", label: "Altele" };
}

/** Only 5-digit vendor codes are resolvable; other numerics are enum ids, not codes. */
export function isVendorCode(v: unknown): boolean {
  return /^\d{5}$/.test(String(v ?? "").trim());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadCodeMap(supabase: any): Promise<CodeMap> {
  const map: CodeMap = new Map();
  const { data, error } = await supabase
    .from("immoflux_codes")
    .select("code, group_key, group_label, label, source");
  if (error) {
    console.error("[immoflux-codes] failed to load code map", error.message);
    return map;
  }
  for (const row of data ?? []) map.set(String(row.code), row as CodeEntry);
  return map;
}

/** Registers codes the vendor sent but we do not know yet, so an admin can name them. */
export async function recordUnmappedCodes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  codes: Iterable<string>,
  map: CodeMap,
): Promise<string[]> {
  const missing = [...new Set([...codes].filter((c) => isVendorCode(c) && !map.has(c)))];
  if (missing.length === 0) return [];
  const rows = missing.map((c) => {
    const g = groupForCode(c);
    return { code: Number(c), group_key: g.key, group_label: g.label, label: null, source: "unmapped" };
  });
  const { error } = await supabase.from("immoflux_codes").upsert(rows, { onConflict: "code", ignoreDuplicates: true });
  if (error) {
    console.error("[immoflux-codes] failed to record unmapped codes", error.message);
    return missing;
  }
  for (const row of rows) map.set(String(row.code), row as CodeEntry);
  console.warn(`[immoflux-codes] ${missing.length} cod(uri) noi nemapate: ${missing.join(", ")}`);
  return missing;
}

export type ResolvedFeatures = {
  labels: string[];
  groups: Array<{ group_key: string; group_label: string; labels: string[] }>;
  unresolved: string[];
};

/** Resolves codes to labels. Codes without a label are dropped, never rendered raw. */
export function resolveCodes(map: CodeMap, codes: Iterable<string>): ResolvedFeatures {
  const seen = new Set<string>();
  const groups = new Map<string, { group_key: string; group_label: string; labels: string[] }>();
  const labels: string[] = [];
  const unresolved: string[] = [];

  for (const raw of codes) {
    const code = String(raw ?? "").trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const entry = map.get(code);
    if (!entry?.label) {
      unresolved.push(code);
      continue;
    }
    labels.push(entry.label);
    const g = groups.get(entry.group_key) ?? {
      group_key: entry.group_key,
      group_label: entry.group_label,
      labels: [],
    };
    if (!g.labels.includes(entry.label)) g.labels.push(entry.label);
    groups.set(entry.group_key, g);
  }

  return { labels, groups: [...groups.values()], unresolved };
}

/** Single label for a code, or null when unknown/unnamed. */
export function labelForCode(map: CodeMap, code: unknown): string | null {
  const key = String(code ?? "").trim();
  if (!key) return null;
  return map.get(key)?.label ?? null;
}

/** First label found in a group (e.g. the heating system among utility codes). */
export function firstLabelInGroup(map: CodeMap, codes: string[], groupKey: string): string | null {
  for (const c of codes) {
    const e = map.get(String(c));
    if (e?.group_key === groupKey && e.label) return e.label;
  }
  return null;
}
