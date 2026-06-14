// Standalone spike. Run: node scripts/prerender-spike.mjs
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'prerender-spike-output');

// Read .env manually
const env = Object.fromEntries(
  (await readFile(resolve(root, '.env'), 'utf8'))
    .split('\n').filter(Boolean)
    .map(l => l.match(/^([^=]+)="?([^"]*)"?$/)).filter(Boolean)
    .map(m => [m[1].trim(), m[2]])
);
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;

function sh(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit', cwd: root, ...opts });
    p.on('exit', c => c === 0 ? res() : rej(new Error(`${cmd} exit ${c}`)));
  });
}

async function build() {
  if (existsSync(resolve(root, 'dist'))) { console.log('[spike] dist exists, skipping build'); return; }
  console.log('[spike] vite build...');
  await sh('npx', ['vite', 'build']);
}

// inline slug helpers (avoid TS import)
const toKebab = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
function immofluxSlug(p) {
  const parts = [];
  const r = p.nrcamere || 1;
  parts.push(r <= 1 ? 'garsoniera' : `apartament-${r}-camere`);
  const surface = p.suprutila || p.supratotal || p.suprafata;
  if (surface > 0) parts.push(`${Math.round(surface)}mp`);
  if (p.etaj !== undefined && p.etaj !== null && p.etaj !== '') {
    const f = typeof p.etaj === 'string' ? parseInt(p.etaj,10) : p.etaj;
    if (!isNaN(f) && f >= 0) parts.push(`etaj-${f}`);
  }
  if (p.zona) { const k = toKebab(p.zona.split(',')[0]); if (k.length > 2) parts.push(k); }
  if (p.localitate) { const k = toKebab(p.localitate.split(',')[0]); if (k.length > 2 && !parts.some(x => x.includes(k))) parts.push(k); }
  if (p.idnum != null) parts.push(String(p.idnum));
  return parts.join('-');
}

async function collectUrls() {
  const sb = createClient(SUPABASE_URL, ANON);
  const { data, error } = await sb.from('catalog_offers').select('slug')
    .eq('is_published', true).is('project_id', null).not('slug','is',null).limit(5);
  if (error) throw error;
  const urls = data.map(d => `/proprietati/${d.slug}`);

  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/immoflux-proxy/properties?page=1`);
    const j = await r.json();
    const first = (j?.data || j?.items || j?.properties || (Array.isArray(j) ? j : []))[0];
    if (first) urls.push(`/proprietate/${immofluxSlug(first)}`);
    else console.log('[spike] immoflux: no first item, skipping');
  } catch (e) { console.log('[spike] immoflux skipped:', e.message); }

  urls.push('/', '/despre-noi');
  return urls;
}

async function serve() {
  const child = spawn('npx', ['-y', 'serve', '-s', 'dist', '-l', '4173'], { cwd: root, stdio: ['ignore','pipe','pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('serve timeout')), 30000);
    child.stdout.on('data', d => { process.stdout.write('[serve] '+d); if (String(d).match(/4173|Accepting/)) { clearTimeout(t); res(); }});
    child.stderr.on('data', d => process.stderr.write('[serve-err] '+d));
  });
  // small grace
  await new Promise(r => setTimeout(r, 500));
  return child;
}

async function main() {
  await build();
  const urls = await collectUrls();
  console.log('[spike] URLs:', urls);
  const server = await serve();
  let browser;
  const results = [];
  const t0 = Date.now();
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    console.log('[spike] Chromium launched OK');
    for (const path of urls) {
      const url = `http://localhost:4173${path}`;
      const page = await browser.newPage();
      const start = Date.now();
      let err = null, html = '';
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        try { await page.waitForSelector('h1', { timeout: 5000 }); } catch {}
        await new Promise(r => setTimeout(r, 1500));
        html = await page.evaluate(() => document.documentElement.outerHTML);
      } catch (e) { err = e.message; html = await page.content().catch(() => ''); }
      const ms = Date.now() - start;
      const safe = path.replace(/[^a-z0-9]+/gi,'_') || 'root';
      await mkdir(resolve(OUT, safe), { recursive: true });
      await writeFile(resolve(OUT, safe, 'index.html'), html);

      // analyze
      const titleM = html.match(/<title>([^<]*)<\/title>/i);
      const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const canM = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      const hasLd = /<script[^>]+application\/ld\+json/i.test(html);
      const hasPrice = /€|EUR/.test(html) && /\d[\d.,]*\s*(€|EUR)/i.test(html);
      const hasSqm = /\d+\s*m(²|p\b)/i.test(html);
      results.push({ path, ms, err, title: titleM?.[1], h1: h1M?.[1]?.replace(/<[^>]+>/g,'').trim().slice(0,80), canonical: canM?.[1], hasLd, hasPrice, hasSqm, htmlSize: html.length });
      await page.close();
    }
  } catch (e) {
    console.error('[spike] FATAL:', e);
    results.push({ fatal: e.message, stack: e.stack });
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
  const total = Date.now() - t0;
  const report = { totalMs: total, results };
  await writeFile(resolve(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== REPORT =====');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
