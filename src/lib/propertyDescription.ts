/**
 * Shared property description composer.
 * Produces a rich, factual, varied Romanian description from listing fields.
 *
 * Variation is deterministic per-listing: identical input → identical output,
 * but two listings (even neighbours in the same complex) land on different
 * sentence templates AND different sentence orders, driven by a hash of the
 * listing's own stable values.
 */

export interface PropertyDescriptionInput {
  rooms?: number | null;
  surface?: number | null;       // usable surface, mp
  floor?: number | string | null;
  totalFloors?: number | null;
  price?: number | null;
  currency?: string | null;
  isSale?: boolean;              // true = sale, false = rent
  projectName?: string | null;
  zone?: string | null;
  city?: string | null;
  balconies?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  yearBuilt?: number | null;
  heating?: string | null;
  furnished?: string | null;
  buildingType?: string | null;
  compartment?: string | null;
  comfort?: string | null;
  propertyType?: string | null;
  storedDescription?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const cleanCoords = (s?: string | null): string | null => {
  if (!s) return null;
  const t = String(s).trim();
  if (!t) return null;
  if (/^-?\d+\.\d+/.test(t)) return null;
  return t;
};

const formatMoney = (n?: number | null, currency?: string | null): string | null => {
  if (!n || !Number.isFinite(Number(n))) return null;
  const c = currency || 'EUR';
  return `${Number(n).toLocaleString('ro-RO')} ${c}`;
};

const capitalize = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/** djb2 + xorshift finalizer for better low-bit diffusion. */
const hash = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return Math.abs(h | 0);
};

/** Per-role variant index, well-distributed across listings. */
const variant = (seed: number, salt: number, mod: number): number =>
  Math.abs(Math.imul(seed ^ salt, 0x27d4eb2d) >>> 0) % mod;

/** Pick item at index modulo length. */
const pick = <T,>(arr: T[], n: number): T => arr[((n % arr.length) + arr.length) % arr.length];

/** Round price/sqm to nearest 50 to avoid false precision. */
const roundPpsqm = (n: number): number => Math.round(n / 50) * 50;

// ── Composer ─────────────────────────────────────────────────────────────

export const composePropertyDescription = (i: PropertyDescriptionInput): string => {
  const stored = (i.storedDescription || '').trim();
  if (stored.length > 150) return stored;

  const rooms = i.rooms && i.rooms > 0 ? Number(i.rooms) : null;
  const surface = i.surface && Number(i.surface) > 0 ? Math.round(Number(i.surface)) : null;
  const isSale = i.isSale !== false;
  const action = isSale ? 'de vânzare' : 'de închiriat';

  const propType = rooms === 1
    ? 'garsonieră'
    : rooms
      ? `apartament cu ${rooms} camere`
      : (i.propertyType || 'apartament');

  const zone = cleanCoords(i.zone);
  const city = cleanCoords(i.city);
  const locLabel = [zone, city].filter(Boolean).join(', ') || city || 'București';

  const priceTxt = formatMoney(i.price, i.currency);
  const ppsqmRaw =
    i.price && surface && surface > 5 && isSale
      ? Number(i.price) / surface
      : null;
  // Include price/sqm only when it's meaningfully off the round (avoids identical filler).
  const ppsqm = ppsqmRaw && ppsqmRaw > 300 ? roundPpsqm(ppsqmRaw) : null;

  const floorStr = (() => {
    if (i.floor === null || i.floor === undefined || i.floor === '') return null;
    if (typeof i.floor === 'number') {
      return i.floor === 0 ? 'parter' : `etajul ${i.floor}${i.totalFloors ? `/${i.totalFloors}` : ''}`;
    }
    const s = String(i.floor);
    if (/^parter$/i.test(s)) return 'parter';
    return `etajul ${s}${i.totalFloors ? `/${i.totalFloors}` : ''}`;
  })();

  // Stable seed from fields that uniquely identify a unit.
  const seed = hash(
    [
      i.projectName || '',
      rooms ?? '',
      surface ?? '',
      i.floor ?? '',
      i.price ?? '',
      zone || '',
    ].join('|')
  );

  // ── Build candidate sentences per role ────────────────────────────────
  const inLoc = i.projectName ? `în ${i.projectName}, ${locLabel}` : `în ${locLabel}`;

  // ROLE A — opening / headline
  const openings: string[] = [
    `${capitalize(propType)} ${action} ${inLoc}.`,
    `Vă propunem un ${propType} ${action} ${inLoc}.`,
    `Disponibil ${action}: ${propType} ${inLoc}.`,
    `${capitalize(inLoc)} — ${propType} ${action}.`,
  ];

  // ROLE B — specs (surface / floor / bathrooms)
  const specBits: string[] = [];
  if (surface) specBits.push(`${surface} mp utili`);
  if (floorStr) specBits.push(floorStr);
  if (i.bathrooms) specBits.push(`${i.bathrooms} ${i.bathrooms === 1 ? 'baie' : 'băi'}`);
  if (i.compartment) specBits.push(`compartimentare ${String(i.compartment).toLowerCase()}`);

  const specsTemplates: ((bits: string[]) => string)[] = [
    (b) => `Configurație: ${b.join(', ')}.`,
    (b) => `Locuința are ${b.join(', ')}.`,
    (b) => `${b[0] ? capitalize(b[0]) : ''}${b.length > 1 ? ', ' + b.slice(1).join(', ') : ''}.`,
    (b) => `Detalii: ${b.join(' · ')}.`,
  ];
  const specsSentence = specBits.length > 0 ? pick(specsTemplates, variant(seed, 0x9e37, specsTemplates.length))(specBits) : '';

  // ROLE C — price
  const priceTemplates: string[] = [];
  if (priceTxt) {
    const suffix = !isSale ? '/lună' : '';
    const ppsTxt = ppsqm ? ` (~${ppsqm.toLocaleString('ro-RO')} ${i.currency || 'EUR'}/mp)` : '';
    if (isSale) {
      priceTemplates.push(`Preț solicitat: ${priceTxt}${ppsTxt}.`);
      priceTemplates.push(`Se vinde la ${priceTxt}${ppsTxt}.`);
      priceTemplates.push(`Cerere: ${priceTxt}${ppsTxt}.`);
      priceTemplates.push(`Listat la ${priceTxt}${ppsTxt}.`);
    } else {
      priceTemplates.push(`Chirie: ${priceTxt}${suffix}.`);
      priceTemplates.push(`Se închiriază cu ${priceTxt}${suffix}.`);
      priceTemplates.push(`Disponibil la ${priceTxt}${suffix}.`);
    }
  }
  const priceSentence = priceTemplates.length > 0 ? pick(priceTemplates, variant(seed, 0x85eb, priceTemplates.length)) : '';

  // ROLE D — amenities / building / context (only if data exists; no boilerplate)
  const amBits: string[] = [];
  if (i.balconies) amBits.push(`${i.balconies} ${i.balconies === 1 ? 'balcon' : 'balcoane'}`);
  if (i.parking) amBits.push(`${i.parking} ${i.parking === 1 ? 'loc de parcare' : 'locuri de parcare'}`);
  if (i.furnished) amBits.push(String(i.furnished).toLowerCase());
  if (i.heating) amBits.push(`încălzire ${String(i.heating).toLowerCase()}`);
  if (i.comfort) amBits.push(`confort ${String(i.comfort).toLowerCase()}`);

  const amTemplates: ((b: string[]) => string)[] = [
    (b) => `Include ${b.join(', ')}.`,
    (b) => `Dotări: ${b.join(', ')}.`,
    (b) => `În plus, ${b.join(', ')}.`,
    (b) => `Beneficiază de ${b.join(', ')}.`,
  ];
  const amSentence = amBits.length > 0 ? pick(amTemplates, variant(seed, 0xc2b2, amTemplates.length))(amBits) : '';

  // ROLE E — building / year (separate, factual only — skip if nothing real)
  const buildBits: string[] = [];
  if (i.yearBuilt) buildBits.push(`an construcție ${i.yearBuilt}`);
  if (i.buildingType) buildBits.push(String(i.buildingType).toLowerCase());
  const buildTemplates: string[] = [];
  if (buildBits.length > 0) {
    buildTemplates.push(`Imobil cu ${buildBits.join(', ')}.`);
    buildTemplates.push(`Bloc: ${buildBits.join(', ')}.`);
    buildTemplates.push(`${capitalize(buildBits.join(', '))}.`);
  }
  const buildSentence = buildTemplates.length > 0 ? pick(buildTemplates, variant(seed, 0x27d4, buildTemplates.length)) : '';

  // ── Choose order ──────────────────────────────────────────────────────
  // Two stable orderings; pick by seed parity.
  const opening = pick(openings, variant(seed, 0x165667, openings.length));
  const ordered = variant(seed, 0xdeadbeef, 2) === 0
    ? [opening, specsSentence, priceSentence, amSentence, buildSentence]
    : [opening, priceSentence, specsSentence, amSentence, buildSentence];

  // Drop empties; if stored snippet exists, weave it in at the end (don't discard).
  const sentences = ordered.filter(Boolean);
  if (stored) sentences.push(stored.replace(/\s+/g, ' '));

  return sentences.join(' ').replace(/\s+/g, ' ').trim();
};

/** Trim text cleanly to ~maxLen for meta description. */
export const composeMetaDescription = (text: string, maxLen = 155): string => {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-–\s]+$/, '') + '…';
};
