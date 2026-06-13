/**
 * Shared property description composer.
 * Produces a rich, factual, varied Romanian description from listing fields.
 * Used by both catalog (PropertyDetail) and Immoflux (ImmofluxPropertyDetail) pages
 * so the two never drift apart.
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

const cleanCoords = (s?: string | null): string | null => {
  if (!s) return null;
  const t = String(s).trim();
  if (!t) return null;
  if (/^-?\d+\.\d+/.test(t)) return null; // looks like GPS
  return t;
};

const formatMoney = (n?: number | null, currency?: string | null): string | null => {
  if (!n || !Number.isFinite(Number(n))) return null;
  const c = currency || 'EUR';
  return `${Number(n).toLocaleString('ro-RO')} ${c}`;
};

/**
 * Compose a varied, factual description (~300-500 chars, 2-4 sentences).
 * Output varies per-listing because surface, floor, price, price/sqm appear inline,
 * and phrasing branches on data (studio vs multi-room, balcony, parking, etc.).
 */
export const composePropertyDescription = (i: PropertyDescriptionInput): string => {
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
  const locParts = [zone, city].filter(Boolean);
  const locLabel = locParts.length ? locParts.join(', ') : (city || 'București');

  const priceTxt = formatMoney(i.price, i.currency);
  const pricePerSqm =
    i.price && surface && surface > 5
      ? Math.round(Number(i.price) / surface)
      : null;

  // ── Sentence 1 — headline fact
  const s1Parts: string[] = [];
  s1Parts.push(
    `${capitalize(propType)} ${action}${i.projectName ? ` în ${i.projectName},` : ''} ${locLabel}`
  );
  const s1Extras: string[] = [];
  if (surface) s1Extras.push(`${surface} mp`);
  if (i.floor !== null && i.floor !== undefined && i.floor !== '') {
    const floorStr = typeof i.floor === 'number'
      ? (i.floor === 0 ? 'parter' : `etaj ${i.floor}${i.totalFloors ? `/${i.totalFloors}` : ''}`)
      : `etaj ${i.floor}${i.totalFloors ? `/${i.totalFloors}` : ''}`;
    s1Extras.push(floorStr);
  }
  if (i.bathrooms) s1Extras.push(`${i.bathrooms} ${i.bathrooms === 1 ? 'baie' : 'băi'}`);
  const s1 = s1Extras.length
    ? `${s1Parts.join(' ')} — ${s1Extras.join(', ')}.`
    : `${s1Parts.join(' ')}.`;

  // ── Sentence 2 — price + price/sqm
  let s2 = '';
  if (priceTxt) {
    const label = isSale ? 'Preț' : 'Chirie';
    s2 = `${label}: ${priceTxt}${!isSale ? '/lună' : ''}`;
    if (pricePerSqm && isSale) s2 += ` (~${pricePerSqm.toLocaleString('ro-RO')} ${i.currency || 'EUR'}/mp)`;
    s2 += '.';
  }

  // ── Sentence 3 — amenities / configuration
  const am: string[] = [];
  if (i.balconies) am.push(`${i.balconies} ${i.balconies === 1 ? 'balcon' : 'balcoane'}`);
  if (i.parking) am.push(`${i.parking} ${i.parking === 1 ? 'loc de parcare' : 'locuri de parcare'}`);
  if (i.furnished) am.push(String(i.furnished).toLowerCase());
  if (i.heating) am.push(`încălzire ${String(i.heating).toLowerCase()}`);
  if (i.compartment) am.push(`compartimentare ${String(i.compartment).toLowerCase()}`);
  if (i.yearBuilt) am.push(`construit în ${i.yearBuilt}`);
  if (i.buildingType) am.push(String(i.buildingType).toLowerCase());
  if (i.comfort) am.push(`confort ${String(i.comfort).toLowerCase()}`);
  const s3 = am.length ? `Dotări: ${am.slice(0, 6).join(', ')}.` : '';

  // ── Sentence 4 — closing context / project
  const s4 = i.projectName
    ? `Unitate în ansamblul ${i.projectName}, zonă cu acces rapid la transport, școli și comerț.`
    : `Zonă bine conectată, cu acces la transport, școli și comerț.`;

  const composed = [s1, s2, s3, s4].filter(Boolean).join(' ');

  // Weave in the stored description (don't discard it) when present but short.
  const stored = (i.storedDescription || '').trim();
  if (stored && stored.length > 0) {
    if (stored.length > 150) return stored;
    // Append short stored text after the composed factual block.
    return `${composed} ${stored}`.replace(/\s+/g, ' ').trim();
  }

  return composed.replace(/\s+/g, ' ').trim();
};

/** Trim text cleanly to ~maxLen for meta description. */
export const composeMetaDescription = (text: string, maxLen = 155): string => {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-–\s]+$/, '') + '…';
};

const capitalize = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
