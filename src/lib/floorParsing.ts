// Parsers for Immoflux property "Etaj" / "Total Etaje" fields.
// Handle string, number, 0, null, undefined, and noisy text values.

export function parseTotalFloors(...candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const s = String(c).trim();
    if (!s) continue;
    const m = s.match(/\d+/);
    if (!m) continue;
    const n = parseInt(m[0], 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    return n;
  }
  return null;
}

export function parseFloor(...candidates: unknown[]): string | number | null {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    const s = String(c).trim();
    if (!s) continue;
    if (/parter|demisol/i.test(s)) {
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }
    const m = s.match(/\d+/);
    if (!m) continue;
    const n = parseInt(m[0], 10);
    if (!Number.isFinite(n) || n < 0) continue;
    return n === 0 ? 'Parter' : n;
  }
  return null;
}
