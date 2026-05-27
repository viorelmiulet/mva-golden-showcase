/**
 * LCP regression guard.
 *
 * If any of these checks fail, homepage Largest Contentful Paint will
 * regress. Update the test ONLY together with a deliberate perf change.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
const heroTsx = readFileSync(resolve(root, 'src/components/Hero.tsx'), 'utf8');

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
