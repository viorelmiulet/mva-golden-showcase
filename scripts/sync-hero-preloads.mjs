// Run with: node scripts/sync-hero-preloads.mjs  [--check]
/**
 * Auto-generate the hero <link rel="preload"> block in index.html
 * from the <picture><source> elements in src/components/Hero.tsx.
 *
 * The single source of truth is Hero.tsx. Run this script after any
 * change to the hero <picture>, or rely on the Vite plugin in
 * vite.config.ts which runs it automatically on dev start, on HMR
 * changes to Hero.tsx, and on every production build.
 *
 *   node scripts/sync-hero-preloads.mjs           # rewrites index.html
 *   node scripts/sync-hero-preloads.mjs --check   # exits 1 if out of sync (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HERO = resolve(root, 'src/components/Hero.tsx');
const HTML = resolve(root, 'index.html');
const START = '<!-- HERO_PRELOADS:START';
const END = '<!-- HERO_PRELOADS:END -->';

/** Extract one Hero `<source type="...">` block. */
function extractSource(tsx, mime) {
  const re = new RegExp(
    `type=["']${mime.replace('/', '\\/')}["'][\\s\\S]*?srcSet=["']([^"']+)["'][\\s\\S]*?sizes=["']([^"']+)["']`,
  );
  const m = re.exec(tsx);
  if (!m) return null;
  return { srcset: m[1].trim(), sizes: m[2].trim() };
}

export function buildPreloadBlock(tsx) {
  const avif = extractSource(tsx, 'image/avif');
  const webp = extractSource(tsx, 'image/webp');
  if (!avif) throw new Error('Hero.tsx: missing <source type="image/avif">');
  if (!webp) throw new Error('Hero.tsx: missing <source type="image/webp">');

  const firstUrl = (s) => s.split(',')[0].trim().split(/\s+/)[0];

  const lines = [
    `    ${START} — AUTO-GENERATED from src/components/Hero.tsx by scripts/sync-hero-preloads.mjs. DO NOT EDIT BY HAND. -->`,
    `    <template id="hero-preloads-template">`,
    `      <link rel="preload" as="image" type="image/avif" href="${firstUrl(avif.srcset)}" imagesrcset="${avif.srcset}" imagesizes="${avif.sizes}" fetchpriority="high" />`,
    `      <link rel="preload" as="image" type="image/webp" href="${firstUrl(webp.srcset)}" imagesrcset="${webp.srcset}" imagesizes="${webp.sizes}" />`,
    `    </template>`,
    `    <script>`,
    `      (() => {`,
    `        const path = window.location.pathname.replace(/\\/+$/, '') || '/';`,
    `        if (path !== '/') return;`,
    `        const template = document.getElementById('hero-preloads-template');`,
    `        if (template?.content) document.head.appendChild(template.content.cloneNode(true));`,
    `      })();`,
    `    </script>`,
    `    ${END}`,
  ];
  return lines.join('\n');
}

export function syncHeroPreloads({ check = false } = {}) {
  const tsx = readFileSync(HERO, 'utf8');
  const html = readFileSync(HTML, 'utf8');

  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      `index.html is missing ${START}…${END} markers — cannot sync hero preloads.`,
    );
  }

  // Replace from start of START line through END line (incl. leading indent).
  const lineStart = html.lastIndexOf('\n', startIdx) + 1;
  const lineEnd = html.indexOf('\n', endIdx);
  const next = html.slice(0, lineStart) + buildPreloadBlock(tsx) + html.slice(lineEnd);

  if (next === html) return { changed: false };
  if (check) {
    return { changed: true, drift: true };
  }
  writeFileSync(HTML, next);
  return { changed: true };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  try {
    const r = syncHeroPreloads({ check });
    if (check && r.drift) {
      console.error(
        '\n  ✖ Hero preloads in index.html are OUT OF SYNC with src/components/Hero.tsx.\n' +
          '    Run: node scripts/sync-hero-preloads.mjs\n',
      );
      process.exit(1);
    }
    console.log(
      r.changed
        ? '  ✔ index.html hero preloads regenerated from Hero.tsx'
        : '  ✔ index.html hero preloads already in sync',
    );
  } catch (e) {
    console.error(`  ✖ ${e.message}`);
    process.exit(1);
  }
}
