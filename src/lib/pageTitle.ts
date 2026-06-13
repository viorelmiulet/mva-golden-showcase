/**
 * Build a page <title> capped at ~60 chars (hard cap 60).
 * Tries: "{base} — MVA Imobiliare" → "{base} — MVA" → truncated "{base}".
 * Truncation cuts on word boundary and adds "…" only when text was removed.
 */
const HARD_CAP = 60;
const FULL_SUFFIX = ' — MVA Imobiliare';
const SHORT_SUFFIX = ' — MVA';

const truncateOnWord = (text: string, max: number): string => {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1); // leave room for the ellipsis
  const lastSpace = cut.lastIndexOf(' ');
  const sliced = lastSpace > Math.floor(max * 0.5) ? cut.slice(0, lastSpace) : cut;
  return sliced.replace(/[\s,;:\-–—]+$/, '') + '…';
};

export const buildPageTitle = (baseTitle: string): string => {
  const base = (baseTitle || '').replace(/\s+/g, ' ').trim();
  if (!base) return 'MVA Imobiliare';

  if ((base + FULL_SUFFIX).length <= HARD_CAP) return base + FULL_SUFFIX;
  if ((base + SHORT_SUFFIX).length <= HARD_CAP) return base + SHORT_SUFFIX;

  // Drop suffix and truncate base on word boundary
  return truncateOnWord(base, HARD_CAP);
};
