/**
 * Generate SEO-friendly slug for a property.
 * Format: apartament-2-camere-militari-residence-gorjului-a1b2
 * Rules:
 * 1. Property type (garsoniera / apartament-N-camere)
 * 2. Complex name in kebab-case
 * 3. Zone if exists
 * 4. First 4 characters of UUID for uniqueness
 */

const toKebab = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generatePropertySlug = (property: {
  id: string;
  rooms?: number | null;
  project_name?: string | null;
  zone?: string | null;
  location?: string | null;
}): string => {
  const parts: string[] = [];

  // 1. Property type
  const rooms = property.rooms || 1;
  if (rooms <= 1) {
    parts.push('garsoniera');
  } else {
    parts.push(`apartament-${rooms}-camere`);
  }

  // 2. Complex name
  if (property.project_name) {
    parts.push(toKebab(property.project_name));
  }

  // 3. Zone
  const zone = property.zone || property.location;
  if (zone) {
    const kebabZone = toKebab(zone.split(',')[0].trim());
    if (kebabZone && !parts.some(p => p.includes(kebabZone))) {
      parts.push(kebabZone);
    }
  }

  // 4. First 4 chars of UUID
  const shortId = property.id.replace(/-/g, '').substring(0, 4);
  parts.push(shortId);

  return parts.join('-');
};

/**
 * Extract the short ID (last segment, 4 chars) from a property slug.
 */
export const extractShortIdFromSlug = (slug: string): string => {
  // The short ID is always the last 4 characters of the slug
  return slug.slice(-4);
};

/**
 * Check if a string looks like a UUID.
 */
export const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Generate property URL path from property data.
 */
export const getPropertyUrl = (property: {
  id: string;
  rooms?: number | null;
  project_name?: string | null;
  zone?: string | null;
  location?: string | null;
}): string => `/proprietati/${generatePropertySlug(property)}`;
