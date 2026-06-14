#!/usr/bin/env node
/**
 * Production prerender step. Runs AFTER `vite build`.
 *
 * CAPPED first-deploy version: prerenders a small number of canonical
 * property pages so we can verify (a) the deploy actually runs this script
 * and (b) Lovable hosting serves the per-route prerendered files.
 *
 * Prerendered pages are PURELY ADDITIVE on top of a working SPA. Any failure
 * here MUST exit 0 — never block the site from deploying.
 *
 * NOTE: slug logic is intentionally inlined (mirrors src/lib/propertySlug.ts:
 * generateImmofluxSlug) because this script runs under plain Node and cannot
 * import .ts. Keep these two in sync if you change the slug format.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const STAGING = resolve(ROOT, 'prerender-staging');

const CATALOG_LIMIT = parseInt(process.env.PRERENDER_CATALOG_LIMIT || '10', 10);
const IMMOFLUX_LIMIT = parseInt(process.env.PRERENDER_IMMOFLUX_LIMIT || '5', 10);
const CONCURRENCY = 4;
const PORT = 4173;

function log(...a) { console.log('[prerender]', ...a); }
function warn(...a) { console.warn('[prerender]', ...a); }

// ---------- env loading ----------
async function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = await readFile(resolve(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch { /* no .env */ }
  return env;
}

// ---------- inlined slug helpers (mirror src/lib/propertySlug.ts) ----------
const toKebab = s => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function generateImmofluxSlug(p) {
  const parts = [];
  const r = p.nrcamere || 1;
  parts.push(r <= 1 ? 'garsoniera' : `apartament-${r}-camere`);
  const surface = p.suprutila || p.supratotal || p.suprafata;
  if (surface > 0) parts.push(`${Math.round(surface)}mp`);
  if (p.etaj !== undefined && p.etaj !== null && p.etaj !== '') {
    const f = typeof p.etaj === 'string' ? parseInt(p.etaj, 10) : p.etaj;
    if (!isNaN(f) && f >= 0) parts.push(`etaj-${f}`);
  }
  if (p.zona) { const k = toKebab(String(p.zona).split(',')[0]); if (k.length > 2) parts.push(k); }
  if (p.localitate) {
    const k = toKebab(String(p.localitate).split(',')[0]);
    if (k.length > 2 && !parts.some(x => x.includes(k))) parts.push(k);
  }
  if (p.idnum !== undefined && p.idnum !== null && !Number.isNaN(Number(p.idnum))) {
    parts.push(String(p.idnum));
  }
  return parts.join('-');
}

// ---------- URL enumeration ----------
async function fetchCatalogSlugs(env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) { warn('missing VITE_SUPABASE_URL/KEY — skipping catalog'); return []; }
  try {
    const u = new URL(`${url}/rest/v1/catalog_offers`);
    u.searchParams.set('select', 'slug');
    u.searchParams.set('is_published', 'eq.true');
    u.searchParams.set('project_id', 'is.null');
    u.searchParams.set('slug', 'not.is.null');
    u.searchParams.set('order', 'updated_at.desc');
    u.searchParams.set('limit', String(CATALOG_LIMIT));
    const r = await fetch(u, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) { warn('catalog fetch', r.status); return []; }
    const data = await r.json();
    return data.filter(d => d.slug).map(d => `/proprietati/${d.slug}`);
  } catch (e) { warn('catalog fetch error:', e.message); return []; }
}

async function fetchImmofluxRoutes(env) {
  const url = env.VITE_SUPABASE_URL;
  if (!url) return [];
  const routes = [];
  try {
    for (let page = 1; routes.length < IMMOFLUX_LIMIT && page <= 3; page++) {
      const r = await fetch(`${url}/functions/v1/immoflux-proxy/properties?page=${page}`);
      if (!r.ok) break;
      const j = await r.json();
      const items = j?.data || j?.items || j?.properties || (Array.isArray(j) ? j : []);
      if (!items.length) break;
      for (const it of items) {
        if (routes.length >= IMMOFLUX_LIMIT) break;
        const slug = generateImmofluxSlug(it);
        if (slug) routes.push(`/proprietate/${slug}`);
      }
    }
  } catch (e) { warn('immoflux fetch error:', e.message); }
  return routes.slice(0, IMMOFLUX_LIMIT);
}

// ---------- static server ----------
function startServer() {
  return new Promise((res, rej) => {
    const child = spawn('npx', ['-y', 'serve', '-s', 'dist', '-l', String(PORT), '--no-clipboard'], {
      cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => rej(new Error('serve startup timeout')), 30000);
    const onData = (d) => {
      const s = String(d);
      process.stdout.write('[serve] ' + s);
      if (s.match(/Accepting|Local:|localhost:4173|4173/)) { clearTimeout(timer); res(child); }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', d => process.stderr.write('[serve-err] ' + d));
    child.on('exit', c => { if (c !== 0) rej(new Error('serve exited ' + c)); });
  });
}

// ---------- puppeteer with chrome auto-install ----------
async function getPuppeteer() {
  let puppeteer;
  try { puppeteer = (await import('puppeteer')).default; }
  catch (e) { warn('puppeteer not installed:', e.message); return null; }
  try {
    return await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  } catch (e) {
    warn('launch failed, attempting chrome install:', e.message);
    try {
      await new Promise((res, rej) => {
        const c = spawn('npx', ['puppeteer', 'browsers', 'install', 'chrome'], { cwd: ROOT, stdio: 'inherit' });
        c.on('exit', code => code === 0 ? res() : rej(new Error('install exit ' + code)));
      });
      return await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (e2) { warn('chrome install/launch failed:', e2.message); return null; }
  }
}

// ---------- per-route render ----------
async function renderRoute(browser, route, summary) {
  const url = `http://localhost:${PORT}${route}`;
  const t0 = Date.now();
  const page = await browser.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    try { await page.waitForSelector('h1', { timeout: 15000 }); } catch { /* keep going */ }
    await new Promise(r => setTimeout(r, 1500));

    // GUARD A: redirect
    const finalUrl = page.url();
    if (!finalUrl.endsWith(route) && !finalUrl.endsWith(route + '/')) {
      log(`redirected: ${route} -> ${finalUrl.replace(`http://localhost:${PORT}`, '')}`);
      summary.skippedRedirect++;
      return null;
    }

    // GUARD B: NotFound state — NotFoundInline page contains "Eroare 404" chip
    // and Immoflux 404 contains "Proprietatea nu a fost găsită"
    const is404 = await page.evaluate(() => {
      const txt = document.body?.innerText || '';
      return /Eroare 404/i.test(txt)
        || /Proprietatea nu a fost g[ăa]sit[ăa]/i.test(txt)
        || document.querySelector('meta[name="robots"][content*="noindex"]') !== null;
    });
    if (is404) {
      log(`notfound: ${route}`);
      summary.skipped404++;
      return null;
    }

    const html = await page.evaluate(() => '<!DOCTYPE html>' + document.documentElement.outerHTML);
    summary.rendered++;
    summary.totalMs += Date.now() - t0;
    return html;
  } catch (e) {
    warn(`failed ${route}:`, e.message);
    summary.failed++;
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

// ---------- concurrency pool ----------
async function pool(items, n, worker) {
  const results = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: n }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------- main ----------
async function main() {
  const wallStart = Date.now();
  if (!existsSync(DIST)) { warn('dist/ missing — vite build must run first. Exiting 0.'); return; }

  const env = await loadEnv();
  log(`caps: catalog=${CATALOG_LIMIT} immoflux=${IMMOFLUX_LIMIT} concurrency=${CONCURRENCY}`);

  const [catalog, immoflux] = await Promise.all([fetchCatalogSlugs(env), fetchImmofluxRoutes(env)]);
  const routes = [...catalog, ...immoflux];
  log(`enumerated ${catalog.length} catalog + ${immoflux.length} immoflux = ${routes.length} routes`);
  if (!routes.length) { log('no routes — nothing to prerender'); return; }

  let server, browser;
  const summary = { rendered: 0, skippedRedirect: 0, skipped404: 0, failed: 0, totalMs: 0 };
  const captured = new Map(); // route -> html

  try {
    server = await startServer();
    log('static server up on :' + PORT);
    browser = await getPuppeteer();
    if (!browser) { warn('no browser — exiting 0'); return; }
    log('chromium launched');

    await pool(routes, CONCURRENCY, async (route) => {
      const html = await renderRoute(browser, route, summary);
      if (html) captured.set(route, html);
    });
  } catch (e) {
    warn('FATAL during render phase:', e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
  }

  // Stage then copy — only after server is down
  try {
    await rm(STAGING, { recursive: true, force: true });
    for (const [route, html] of captured) {
      const dir = resolve(STAGING, '.' + route);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'index.html'), html);
    }
    let copied = 0;
    for (const [route] of captured) {
      const src = resolve(STAGING, '.' + route, 'index.html');
      const dest = resolve(DIST, '.' + route, 'index.html');
      await mkdir(dirname(dest), { recursive: true });
      await cp(src, dest);
      copied++;
    }
    log(`copied ${copied} prerendered files into dist/`);
  } catch (e) {
    warn('staging/copy failed:', e.message);
  }

  const wall = Date.now() - wallStart;
  const avg = summary.rendered ? Math.round(summary.totalMs / summary.rendered) : 0;
  log('===== PRERENDER SUMMARY =====');
  log(`rendered:           ${summary.rendered}`);
  log(`skipped (redirect): ${summary.skippedRedirect}`);
  log(`skipped (404):      ${summary.skipped404}`);
  log(`failed:             ${summary.failed}`);
  log(`per-page avg:       ${avg} ms`);
  log(`wall clock:         ${wall} ms`);
  log('=============================');
}

main().then(() => process.exit(0)).catch(e => {
  warn('uncaught — exiting 0 anyway:', e?.stack || e);
  process.exit(0);
});
