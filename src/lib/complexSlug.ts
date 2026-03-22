const toKebab = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface ComplexSlugSource {
  id: string;
  name: string;
  location?: string | null;
  slug?: string | null;
}

export const isUUID = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const generateComplexSlug = (complex: ComplexSlugSource): string => {
  if (complex.slug?.trim()) {
    return complex.slug.trim();
  }

  const namePart = toKebab(complex.name || 'ansamblu-rezidential');
  const shortId = complex.id.replace(/-/g, '').slice(0, 4);

  return `${namePart}-${shortId}`;
};

export const getComplexUrl = (complex: ComplexSlugSource): string =>
  `/complexe/${generateComplexSlug(complex)}`;