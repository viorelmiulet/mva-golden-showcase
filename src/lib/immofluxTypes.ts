/**
 * Shared, type-agnostic normalisation helpers for the Immoflux feed.
 *
 * Immoflux has no single "type" field. Residential listings populate
 * `tiplocuinta`, non-residential buildings populate `tipimobil`, and land
 * populates `tipteren` / `clasificareteren`. Reading only one field silently
 * mislabels (or nulls) everything else, which is how houses, halls, commercial
 * spaces and land disappeared from the catalog.
 */

export interface ImmofluxTypeSource {
  tiplocuinta?: string | null;
  tipimobil?: string | null;
  tipteren?: string | null;
  clasificareteren?: string | null;
  tip?: string | null;
}

const RESIDENTIAL_BUILDING_HINTS = [
  "bloc",
  "apartament",
  "casa",
  "casă",
  "vila",
  "vilă",
  "duplex",
  "locuinta",
  "locuință",
];

const clean = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

/** True when `tipimobil` merely describes the residential container (e.g. "bloc de apartamente"). */
function isResidentialBuilding(tipimobil: string): boolean {
  const s = tipimobil.toLowerCase();
  return RESIDENTIAL_BUILDING_HINTS.some((h) => s.includes(h));
}

/**
 * Maps a raw feed value onto the canonical slugs the UI filters on
 * (see src/lib/propertyType.ts). Immoflux uses composite labels such as
 * "casa / vila" or "spatiu industrial", which would otherwise never match
 * the "casa" / "depozit" filter options.
 *
 * Unknown values still pass through verbatim — nothing is dropped.
 */
export function canonicalizeType(raw: string): string {
  const s = raw
    .toLowerCase()
    .trim()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");
  if (/teren|lot\b|parcela/.test(s)) return "teren";
  if (/garsoniera|studio/.test(s)) return "garsoniera";
  if (/casa|vila|duplex|locuinta individuala/.test(s)) return "casa";
  if (/hala|depozit|industrial|logistic/.test(s)) return "depozit";
  if (/comercial|birou|birouri|spatiu de birouri/.test(s)) return "spatiu comercial";
  if (/apartament|apartment/.test(s)) return "apartament";
  return s;
}

/** Which source field produced the type — used for diagnostics/logging. */
export function typeSourceField(p: ImmofluxTypeSource): string | null {
  if (clean(p.tipteren)) return "tipteren";
  const tipimobil = clean(p.tipimobil);
  if (tipimobil && !isResidentialBuilding(tipimobil)) return "tipimobil";
  if (clean(p.tiplocuinta)) return "tiplocuinta";
  if (clean(p.tip)) return "tip";
  if (tipimobil) return "tipimobil";
  return null;
}

/**
 * Derives one normalized property_type from all four source fields.
 *
 * Precedence:
 *   1. `tipteren` present            -> "teren"
 *   2. `tipimobil` present and NOT a residential container -> `tipimobil`
 *   3. `tiplocuinta`
 *   4. `tip` (top-level category, e.g. "casa / vila", "spatiu industrial")
 *
 * Every value is canonicalized; unknown values pass through verbatim.
 */
export function normalizeImmofluxType(p: ImmofluxTypeSource): string | null {
  const tipteren = clean(p.tipteren);
  if (tipteren) return "teren";

  const tipimobil = clean(p.tipimobil);
  if (tipimobil && !isResidentialBuilding(tipimobil)) return canonicalizeType(tipimobil);

  const tiplocuinta = clean(p.tiplocuinta);
  if (tiplocuinta) return canonicalizeType(tiplocuinta);

  const tip = clean(p.tip);
  if (tip) return canonicalizeType(tip);

  return tipimobil ? canonicalizeType(tipimobil) : null;
}

/** Secondary classification: land subtype, or the building type for non-residential. */
export function normalizeImmofluxSubtype(p: ImmofluxTypeSource): string | null {
  return clean(p.tipteren) ?? clean(p.clasificareteren) ?? null;
}

/**
 * Coded value lists (utilitati/finisaje/dotari) are numeric codes grouped by
 * prefix. Rather than a hardcoded allowlist that loses new codes, group them
 * systematically so unmapped codes survive and can still be displayed.
 */
export function codeGroup(code: string): string {
  const c = String(code).trim();
  const p3 = c.slice(0, 3);
  switch (p3) {
    case "100":
      return "utilitati_generale";
    case "101":
      return "incalzire";
    case "102":
      return "climatizare";
    case "103":
      return "utilitati_teren";
    default:
      break;
  }
  if (c.startsWith("2")) return "finisaje";
  if (c.startsWith("3")) return "dotari";
  return "altele";
}

/** Groups raw codes by prefix family, preserving every code including unmapped ones. */
export function groupCodesByPrefix(codes: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const raw of codes) {
    const code = String(raw).trim();
    if (!code) continue;
    const g = codeGroup(code);
    (out[g] ||= []).push(code);
  }
  return out;
}

/** Builds the persisted `source_codes` payload: raw arrays + prefix grouping. */
export function buildSourceCodes(input: {
  utilitati?: string[];
  finisaje?: string[];
  dotari?: string[];
  bucatarie?: string[];
}): Record<string, unknown> | null {
  const raw = {
    utilitati: input.utilitati ?? [],
    finisaje: input.finisaje ?? [],
    dotari: input.dotari ?? [],
    bucatarie: input.bucatarie ?? [],
  };
  const all = [...raw.utilitati, ...raw.finisaje, ...raw.dotari, ...raw.bucatarie];
  if (all.length === 0) return null;
  return { raw, grouped: groupCodesByPrefix(all) };
}
