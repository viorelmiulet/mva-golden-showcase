/**
 * Generate SEO-friendly slug for a property.
 * Format: apartament-2-camere-65mp-etaj-3-militari-residence-bucuresti-militari-a1b2
 * Rules:
 * 1. Property type (garsoniera / apartament-N-camere)
 * 2. Surface (65mp)
 * 3. Floor (etaj-3)
 * 4. Project name in kebab-case
 * 5. City
 * 6. Zone (if not coordinates and different from project/city)
 * 7. First 4 characters of UUID for uniqueness
 */

const toKebab = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface PropertySlugSource {
  id: string;
  rooms?: number | null;
  project_name?: string | null;
  zone?: string | null;
  location?: string | null;
  surface_min?: number | null;
  floor?: number | null;
  city?: string | null;
}

export const generatePropertySlug = (property: PropertySlugSource): string => {
  const parts: string[] = [];

  // 1. Property type
  const rooms = property.rooms || 1;
  if (rooms <= 1) {
    parts.push('garsoniera');
  } else {
    parts.push(`apartament-${rooms}-camere`);
  }

  // 2. Surface
  if (property.surface_min && property.surface_min > 0) {
    parts.push(`${property.surface_min}mp`);
  }

  // 3. Floor
  if (property.floor !== null && property.floor !== undefined && property.floor >= 0) {
    parts.push(`etaj-${property.floor}`);
  }

  // 4. Project name
  if (property.project_name) {
    const kebabProject = toKebab(property.project_name);
    if (kebabProject) parts.push(kebabProject);
  }

  // 5. City
  if (property.city) {
    const kebabCity = toKebab(property.city);
    if (kebabCity && kebabCity.length > 1 && !parts.some(p => p.includes(kebabCity))) {
      parts.push(kebabCity);
    }
  }

  // 6. Zone — only if NOT GPS coordinates
  const zone = property.zone || property.location;
  if (zone) {
    const isCoordinates = /^\d|.*\d{2,}\.\d{3,}/.test(zone);
    if (!isCoordinates) {
      const kebabZone = toKebab(zone.split(',')[0].trim());
      if (kebabZone && kebabZone.length > 2 && !parts.some(p => p.includes(kebabZone))) {
        parts.push(kebabZone);
      }
    }
  }

  // 7. First 4 chars of UUID
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
export const getPropertyUrl = (property: PropertySlugSource): string =>
  `/proprietati/${generatePropertySlug(property)}`;

/**
 * Generate SEO-friendly slug for an Immoflux property.
 * Format: apartament-2-camere-65mp-etaj-3-militari-bucuresti-196065
 */
export const generateImmofluxSlug = (property: {
  idnum: number;
  nrcamere?: number;
  zona?: string;
  localitate?: string;
  titlu?: { ro?: string } | string;
  suprutila?: number;
  supratotal?: number;
  suprafata?: number;
  etaj?: number | string;
}): string => {
  const parts: string[] = [];

  // 1. Property type
  const rooms = property.nrcamere || 1;
  if (rooms <= 1) {
    parts.push('garsoniera');
  } else {
    parts.push(`apartament-${rooms}-camere`);
  }

  // 2. Surface
  const surface = property.suprutila || property.supratotal || property.suprafata;
  if (surface && surface > 0) {
    parts.push(`${Math.round(surface)}mp`);
  }

  // 3. Floor
  if (property.etaj !== undefined && property.etaj !== null && property.etaj !== '') {
    const floorNum = typeof property.etaj === 'string' ? parseInt(property.etaj, 10) : property.etaj;
    if (!isNaN(floorNum) && floorNum >= 0) {
      parts.push(`etaj-${floorNum}`);
    }
  }

  // 4. Zone
  if (property.zona) {
    const kebabZone = toKebab(property.zona.split(',')[0].trim());
    if (kebabZone && kebabZone.length > 2 && !parts.some(p => p.includes(kebabZone))) {
      parts.push(kebabZone);
    }
  }

  // 5. City
  if (property.localitate) {
    const kebabCity = toKebab(property.localitate.split(',')[0].trim());
    if (kebabCity && kebabCity.length > 2 && !parts.some(p => p.includes(kebabCity))) {
      parts.push(kebabCity);
    }
  }

  // 6. Numeric ID for uniqueness
  parts.push(String(property.idnum));

  return parts.join('-');
};

export const extractImmofluxIdFromSlug = (slug: string): string | null => {
  const match = slug.match(/(\d+)$/);
  return match ? match[1] : null;
};

export const getImmofluxPropertyUrl = (property: {
  idnum: number;
  nrcamere?: number;
  zona?: string;
  localitate?: string;
  titlu?: { ro?: string } | string;
  suprutila?: number;
  supratotal?: number;
  suprafata?: number;
  etaj?: number | string;
}): string => `/proprietate/${generateImmofluxSlug(property)}`;
