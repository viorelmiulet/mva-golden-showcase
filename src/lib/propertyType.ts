/**
 * Property type normalization shared by the homepage hero and /proprietati.
 *
 * The catalog stores inconsistent values: `apartament`, `garsoniera`, `depozit`
 * and NULL (a house imported without a type). The UI must therefore derive an
 * "effective" type instead of trusting `property_type` alone.
 */

export const normalizeType = (s: unknown) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");

/** True for stored values that mean "apartment" (any language/spelling). */
export const isApartmentType = (raw: unknown) => {
  const t = normalizeType(raw);
  return t.startsWith("apartament") || t.startsWith("apartment");
};

/** Fallback inference from the listing title when `property_type` is empty. */
const inferFromTitle = (title: unknown): string | null => {
  const t = normalizeType(title);
  if (!t) return null;
  if (/\b(casa|vila|duplex)\b/.test(t)) return "casa";
  if (/\bteren\b/.test(t)) return "teren";
  if (/\b(hala|depozit)\b/.test(t)) return "depozit";
  if (/\b(spatiu|birou|comercial)\b/.test(t)) return "spatiu comercial";
  if (/\bgarsoniera\b/.test(t)) return "garsoniera";
  if (/\bapartament\b/.test(t) || /^ap\.?\s/.test(t)) return "apartament";
  return null;
};

/**
 * Canonical slug for a listing's type. Studios are always `garsoniera`,
 * whether stored as such or as a 1-room apartment.
 */
export const effectiveTypeKey = (p: any): string | null => {
  const stored = normalizeType(p?.property_type);
  const key = stored || inferFromTitle(p?.title);
  if (!key) return null;
  if (isApartmentType(key) && Number(p?.rooms) === 1) return "garsoniera";
  if (isApartmentType(key)) return "apartament";
  return key;
};

const LABELS: Record<string, string> = {
  apartament: "Apartament",
  garsoniera: "Garsonieră",
  casa: "Casă / Vilă",
  teren: "Teren",
  depozit: "Hală / Depozit",
  "spatiu comercial": "Spațiu comercial",
};

export const typeLabel = (key: string) =>
  LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);

/** Distinct, non-empty type options present in the given listings. */
export const buildTypeOptions = (rows: any[]): [string, string][] => {
  const set = new Set<string>();
  for (const p of rows || []) {
    const k = effectiveTypeKey(p);
    if (k) set.add(k);
  }
  return Array.from(set)
    .map((k) => [k, typeLabel(k)] as [string, string])
    .sort((a, b) => a[1].localeCompare(b[1], "ro"));
};

/** Does this listing match the requested `tip_proprietate` value? */
export const matchesTypeFilter = (p: any, requested: string) => {
  const want = normalizeType(requested);
  if (!want) return true;
  const key = effectiveTypeKey(p);
  if (want === "garsoniera") return key === "garsoniera";
  if (isApartmentType(want)) return key === "apartament";
  return key === want;
};
