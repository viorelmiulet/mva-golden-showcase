/**
 * LCP regression guard.
 *
 * If any of these checks fail, homepage Largest Contentful Paint will
 * regress. Update the test ONLY together with a deliberate perf change.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
const heroTsx = readFileSync(resolve(root, 'src/components/Hero.tsx'), 'utf8');

/** Extract every `<link rel="preload" as="image">` from index.html. */
function extractImagePreloads(html: string) {
  const out: Array<{ href: string; imagesrcset: string | null; type: string | null; fetchpriority: string | null }> = [];
  const re = /<link\b[^>]*\brel=["']preload["'][^>]*\bas=["']image["'][^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const tag = m[0];
    const attr = (name: string) => {
      const r = new RegExp(`\\b${name}=["']([^"']+)["']`, 'i').exec(tag);
      return r ? r[1] : null;
    };
    out.push({
      href: attr('href') || '',
      imagesrcset: attr('imagesrcset'),
      type: attr('type'),
      fetchpriority: attr('fetchpriority'),
    });
  }
  return out;
}

/** All URLs referenced by a `<picture>` block in Hero.tsx (srcset hrefs + img src). */
function extractHeroPictureUrls(tsx: string): string[] {
  const urls = new Set<string>();
  for (const m of tsx.matchAll(/srcSet=["']([^"']+)["']/g)) {
    for (const part of m[1].split(',')) urls.add(part.trim().split(/\s+/)[0]);
  }
  for (const m of tsx.matchAll(/<img[^>]*\bsrc=["']([^"']+)["']/g)) urls.add(m[1]);
  return [...urls];
}

/** Parse `imagesrcset`/`srcSet` into normalized [url, descriptor] entries. */
function parseSrcset(srcset: string): Array<{ url: string; descriptor: string }> {
  return srcset
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [url, descriptor = ''] = entry.split(/\s+/);
      return { url, descriptor };
    });
}

/** Extract a Hero `<source type="...">` srcSet (or undefined if absent). */
function extractHeroSourceSrcset(tsx: string, mime: string): string | undefined {
  const re = new RegExp(`type=["']${mime.replace('/', '\\/')}["'][\\s\\S]*?srcSet=["']([^"']+)["']`);
  return re.exec(tsx)?.[1];
}

/**
 * Build a human-readable diff report when a Hero <source> and its matching
 * <link rel=preload> drift apart. Returns null when they're in sync.
 *
 * The report is intentionally verbose so a failing CI log tells you EXACTLY
 * which descriptor / url / attribute changed — no need to re-run locally.
 */
function diffHeroVsPreload(opts: {
  type: 'image/avif' | 'image/webp';
  heroSrcset: string | undefined;
  preloadHref: string | undefined;
  preloadSrcset: string | undefined;
  preloadFetchpriority: string | null | undefined;
}): string | null {
  const { type, heroSrcset, preloadHref, preloadSrcset, preloadFetchpriority } = opts;
  const problems: string[] = [];

  if (!heroSrcset) problems.push(`Hero.tsx is missing a <source type="${type}"> element`);
  if (!preloadSrcset) problems.push(`index.html is missing a <link rel="preload" type="${type}">`);

  if (heroSrcset && preloadSrcset) {
    const hero = parseSrcset(heroSrcset);
    const pre = parseSrcset(preloadSrcset);
    const heroByDesc = new Map(hero.map((e) => [e.descriptor || '_', e.url]));
    const preByDesc = new Map(pre.map((e) => [e.descriptor || '_', e.url]));

    for (const d of new Set([...heroByDesc.keys(), ...preByDesc.keys()])) {
      const h = heroByDesc.get(d);
      const p = preByDesc.get(d);
      if (h !== p) {
        problems.push(`descriptor "${d}": Hero=${h ?? '<missing>'}  ≠  preload=${p ?? '<missing>'}`);
      }
    }

    const firstPreUrl = pre[0]?.url;
    if (preloadHref && firstPreUrl && preloadHref !== firstPreUrl) {
      problems.push(`preload href="${preloadHref}" ≠ first imagesrcset entry "${firstPreUrl}"`);
    }
  }

  if (type === 'image/avif' && preloadFetchpriority !== 'high') {
    problems.push(`AVIF preload should have fetchpriority="high" (got "${preloadFetchpriority ?? 'unset'}")`);
  }

  if (problems.length === 0) return null;

  return [
    '',
    `  ⚠️  ${type} preload ↔ Hero <picture> MISMATCH`,
    `     ────────────────────────────────────────────`,
    `     Hero srcSet    : ${heroSrcset ?? '<missing>'}`,
    `     Preload href   : ${preloadHref ?? '<missing>'}`,
    `     Preload srcset : ${preloadSrcset ?? '<missing>'}`,
    `     Fetchpriority  : ${preloadFetchpriority ?? '<unset>'}`,
    `     Problems:`,
    ...problems.map((p) => `       • ${p}`),
    `     → Fix: align <source type="${type}"> in src/components/Hero.tsx with`,
    `       the matching <link rel="preload" type="${type}"> in index.html.`,
    '',
  ].join('\n');
}


describe('LCP: index.html critical preloads', () => {
  it('preloads hero AVIF with high fetchpriority and responsive srcset', () => {
    expect(indexHtml).toMatch(
      /<link[^>]*rel=["']preload["'][^>]*type=["']image\/avif["'][^>]*href=["']\/hero-mobile\.avif["'][^>]*fetchpriority=["']high["']/i,
    );
    expect(indexHtml).toMatch(/imagesrcset=["'][^"']*hero-mobile\.avif 768w[^"']*hero-desktop\.avif 1440w/i);
  });

  it('keeps WebP fallback preload for browsers without AVIF support', () => {
    expect(indexHtml).toMatch(
      /<link[^>]*rel=["']preload["'][^>]*type=["']image\/webp["'][^>]*href=["']\/hero-mobile\.webp["']/i,
    );
  });

  it('preloads the logo (above-the-fold)', () => {
    expect(indexHtml).toMatch(/rel=["']preload["'][^>]*href=["']\/mva-logo-luxury-horizontal\.svg["'][^>]*as=["']image["']/i);
  });

  it('preconnects to Supabase and Google Fonts origins', () => {
    expect(indexHtml).toMatch(/rel=["']preconnect["'][^>]*fdpandnzblzvamhsoukt\.supabase\.co/);
    expect(indexHtml).toMatch(/rel=["']preconnect["'][^>]*fonts\.gstatic\.com/);
  });

  it('loads Google Fonts non-blocking (preload + swap)', () => {
    expect(indexHtml).toMatch(/rel=["']preload["'][^>]*as=["']style["'][^>]*fonts\.googleapis\.com[^"']*display=swap/);
    expect(indexHtml).toMatch(/onload=["']this\.onload=null;this\.rel=['"]stylesheet/);
  });

  it('declares font-display: swap for hero fonts', () => {
    for (const fam of ['Inter', 'Playfair Display', 'Cinzel']) {
      const re = new RegExp(`font-family:\\s*['"]${fam}['"][^}]*font-display:\\s*swap`, 's');
      expect(indexHtml).toMatch(re);
    }
  });

  it('defers Google Analytics and Plausible scripts (no render-blocking)', () => {
    expect(indexHtml).toMatch(/setTimeout[\s\S]*googletagmanager\.com\/gtag\/js/);
    expect(indexHtml).toMatch(/setTimeout[\s\S]*plausible\.io\/js/);

    // Neither script should be loaded synchronously in head
    expect(indexHtml).not.toMatch(/<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js/);
    expect(indexHtml).not.toMatch(/<script[^>]+src=["']https:\/\/plausible\.io\/js/);
  });
});

describe('LCP: Hero component LCP image', () => {
  it('uses <picture> with AVIF + WebP sources', () => {
    expect(heroTsx).toMatch(/<picture>/);
    expect(heroTsx).toMatch(/type=["']image\/avif["'][\s\S]*hero-mobile\.avif 768w[\s\S]*hero-desktop\.avif 1440w/);
    expect(heroTsx).toMatch(/type=["']image\/webp["'][\s\S]*hero-mobile\.webp 768w[\s\S]*hero-desktop\.webp 1440w/);
  });

  it('marks the LCP image eager + fetchpriority=high + decoding=async', () => {
    expect(heroTsx).toMatch(/loading=["']eager["']/);
    expect(heroTsx).toMatch(/fetchpriority=["']high["']/);
    expect(heroTsx).toMatch(/decoding=["']async["']/);
  });

  it('declares explicit width/height to prevent CLS', () => {
    expect(heroTsx).toMatch(/width=\{1440\}/);
    expect(heroTsx).toMatch(/height=\{810\}/);
  });
});

describe('LCP: hero asset budget', () => {
  const sizeKb = (p: string) =>
    readFileSync(resolve(root, p)).byteLength / 1024;

  // Hard ceilings — bumping them is a perf regression decision.
  it('hero AVIF stays under budget', () => {
    expect(sizeKb('public/hero-mobile.avif')).toBeLessThan(40);
    expect(sizeKb('public/hero-desktop.avif')).toBeLessThan(60);
  });

  it('hero WebP fallback stays under budget', () => {
    expect(sizeKb('public/hero-mobile.webp')).toBeLessThan(80);
    expect(sizeKb('public/hero-desktop.webp')).toBeLessThan(140);
  });

  it('og-image.jpg stays under budget (homepage page weight)', () => {
    expect(sizeKb('public/og-image.jpg')).toBeLessThan(150);
  });
});

describe('LCP: cache headers for hero + og-image', () => {
  const headers = readFileSync(resolve(root, 'public/_headers'), 'utf8');
  const netlify = readFileSync(resolve(root, 'netlify.toml'), 'utf8');
  const lcpAssets = [
    '/hero-mobile.avif',
    '/hero-desktop.avif',
    '/hero-mobile.webp',
    '/hero-desktop.webp',
    '/og-image.jpg',
  ];

  it.each(lcpAssets)('public/_headers marks %s immutable for 1 year', (path) => {
    const block = new RegExp(
      `${path.replace('.', '\\.')}\\s*\\n\\s*Cache-Control:\\s*public,\\s*max-age=31536000,\\s*immutable`,
      'i',
    );
    expect(headers).toMatch(block);
  });

  it.each(lcpAssets)('netlify.toml marks %s immutable for 1 year', (path) => {
    const block = new RegExp(
      `for\\s*=\\s*"${path.replace('.', '\\.')}"[\\s\\S]{0,200}max-age=31536000,\\s*immutable`,
      'i',
    );
    expect(netlify).toMatch(block);
  });
});

describe('LCP: logo (above-the-fold critical resource)', () => {
  const logoPath = '/mva-logo-luxury-horizontal.svg';

  it('logo file referenced by preload exists on disk', () => {
    expect(existsSync(resolve(root, 'public', logoPath.slice(1)))).toBe(true);
  });

  it('logo is rendered inline in initial HTML shell (no JS needed for paint)', () => {
    expect(indexHtml).toMatch(new RegExp(`<img[^>]*src=["']${logoPath}["']`));
  });

  it('logo SVG stays under 20 KB', () => {
    const kb = statSync(resolve(root, 'public', logoPath.slice(1))).size / 1024;
    expect(kb).toBeLessThan(20);
  });

  it('logo is preloaded as image (matches above-the-fold usage)', () => {
    const preloads = extractImagePreloads(indexHtml);
    expect(preloads.some((p) => p.href === logoPath)).toBe(true);
  });
});

describe('LCP: og-image consistency', () => {
  it('og:image and twitter:image both point at /og-image.jpg on prod domain', () => {
    expect(indexHtml).toMatch(/property=["']og:image["']\s+content=["']https:\/\/mvaimobiliare\.ro\/og-image\.jpg["']/);
    expect(indexHtml).toMatch(/name=["']twitter:image["']\s+content=["']https:\/\/mvaimobiliare\.ro\/og-image\.jpg["']/);
  });

  it('declared og:image dimensions (1200x630) match the file', () => {
    expect(indexHtml).toMatch(/property=["']og:image:width["']\s+content=["']1200["']/);
    expect(indexHtml).toMatch(/property=["']og:image:height["']\s+content=["']630["']/);
    expect(existsSync(resolve(root, 'public/og-image.jpg'))).toBe(true);
  });
});

describe('LCP: <picture> ↔ <link rel=preload> stay in sync', () => {
  const preloads = extractImagePreloads(indexHtml);
  const heroUrls = extractHeroPictureUrls(heroTsx);

  it('every URL used in Hero <picture> exists in /public', () => {
    for (const url of heroUrls) {
      expect(
        existsSync(resolve(root, 'public', url.replace(/^\//, ''))),
        `Hero <picture> references ${url} but file is missing in /public`,
      ).toBe(true);
    }
  });

  it('AVIF preload href + imagesrcset match the Hero AVIF <source>', () => {
    const avif = preloads.find((p) => p.type === 'image/avif');
    expect(avif, 'missing <link rel=preload type=image/avif>').toBeDefined();
    expect(avif!.fetchpriority).toBe('high');
    const heroAvif = /type=["']image\/avif["'][\s\S]*?srcSet=["']([^"']+)["']/.exec(heroTsx)?.[1];
    expect(heroAvif, 'Hero is missing an AVIF <source>').toBeDefined();
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    expect(norm(avif!.imagesrcset || '')).toBe(norm(heroAvif!));
    const firstUrl = avif!.imagesrcset!.split(',')[0].trim().split(/\s+/)[0];
    expect(avif!.href).toBe(firstUrl);
  });

  it('WebP preload href + imagesrcset match the Hero WebP <source>', () => {
    const webp = preloads.find((p) => p.type === 'image/webp');
    expect(webp, 'missing <link rel=preload type=image/webp>').toBeDefined();
    const heroWebp = /type=["']image\/webp["'][\s\S]*?srcSet=["']([^"']+)["']/.exec(heroTsx)?.[1];
    expect(heroWebp, 'Hero is missing a WebP <source>').toBeDefined();
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    expect(norm(webp!.imagesrcset || '')).toBe(norm(heroWebp!));
    const firstUrl = webp!.imagesrcset!.split(',')[0].trim().split(/\s+/)[0];
    expect(webp!.href).toBe(firstUrl);
  });

  it('exactly one preload is marked fetchpriority=high (the LCP candidate)', () => {
    const high = preloads.filter((p) => p.fetchpriority === 'high');
    expect(high).toHaveLength(1);
    expect(high[0].type).toBe('image/avif');
  });

  it('every preloaded image asset is also cache-immutable', () => {
    const cacheHeaders = readFileSync(resolve(root, 'public/_headers'), 'utf8');
    for (const p of preloads) {
      // Skip SVG logo — cached but not immutable on purpose (can be swapped)
      if (p.href.endsWith('.svg')) continue;
      const re = new RegExp(
        `${p.href.replace('.', '\\.')}\\s*\\n\\s*Cache-Control:[^\\n]*immutable`,
        'i',
      );
      expect(cacheHeaders, `Missing immutable cache rule for preloaded ${p.href}`).toMatch(re);
    }
  });
});


