// Shared helpers for property "stat" cards (Detalii Anunț).
// Centralizes the rule for hiding empty/zero values so pages don't duplicate it.

export type StatItem<I = any> = {
  label: string;
  value: string | number | null | undefined;
  icon: I;
  tone: string;
};

/**
 * Returns true when a stat value is meaningful and should be displayed.
 * Treats null, undefined, empty strings, 0 and "0" (with any whitespace) as missing.
 */
export function isValidStatValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (value === '' || value === 0) return false;
  if (typeof value === 'string' && value.trim() === '0') return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * Filters a list of stat items, keeping only those with a valid value.
 * Generic over the icon type so callers can keep their own component refs.
 */
export function filterStatItems<I>(items: StatItem<I>[]): StatItem<I>[] {
  return items.filter((s) => isValidStatValue(s.value));
}
