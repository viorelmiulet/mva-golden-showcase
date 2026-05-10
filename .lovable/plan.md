# Monitor Redirecturi 301 — SEO Health

## Obiectiv

Verificare automată că URL-urile vechi/non-canonice returnează `301 Moved Permanently` spre slug-ul canonic. Dacă status code-ul devine altceva (200, 302, 404, 5xx), se trimite alertă email către admin.

> Context: în verificarea anterioară am descoperit că redirecturile *nu* funcționează în prezent (returnează 200, pentru că domeniul nu trece prin Netlify). Acest monitor face vizibilă problema în timp real și va confirma când e rezolvată.

## Componente

### 1. Tabel DB nou: `redirect_monitor_checks`
Stochează rezultatul fiecărei verificări per URL.
- `id`, `url_tested`, `expected_status` (default 301), `actual_status`, `actual_location`, `is_healthy` (bool), `response_time_ms`, `error_message`, `checked_at`
- RLS: doar admin poate citi (verificare prin `adminApi`).

### 2. Tabel DB nou: `redirect_monitor_targets`
Lista URL-urilor de monitorizat (editabilă din UI).
- `id`, `url`, `expected_status` (default 301), `expected_location_pattern` (opțional, regex), `is_active`, `note`, `created_at`
- Pre-populare cu ~6 URL-uri reprezentative:
  - `/proprietati/old-name-7c0f` (short ID existent → 301 spre canonic)
  - `/proprietati/garsoniera-12345` (numeric pe rută greșită → 301 spre `/proprietate/`)
  - + 2 variante pentru complexe și 2 pentru bloguri

### 3. Edge Function: `monitor-redirects`
- Parcurge toate URL-urile active din `redirect_monitor_targets`.
- Face `fetch(url, { redirect: 'manual' })` și citește `status` + header `Location`.
- Inserează rezultat în `redirect_monitor_checks`.
- Dacă `actual_status !== expected_status` → trimite email prin Mailgun (folosește `MAILGUN_API_KEY` deja configurat) către admin, cu sumar al URL-urilor "broken".
- Anti-spam: o singură alertă per URL la 6 ore (verifică ultima alertă în `checked_at`).
- Returnează JSON cu sumar.

### 4. Cron job (pg_cron)
- Rulează `monitor-redirects` o dată la **6 ore**.
- Configurat printr-un `INSERT` direct (nu migrație) pentru că include URL + service key.

### 5. Pagină admin: `/admin/seo/redirect-monitor`
Componente UI:
- **Card sumar sus**: `X/Y healthy`, ultima rulare, buton "Run check now" (apel manual la edge function).
- **Tabel "Targets"** (CRUD inline): URL, status așteptat, ultimul status real (badge verde/roșu), ultimul check, acțiuni (edit / activate / delete).
- **Tabel "Recent checks"** (ultimele 100): URL, status, location returnat, timp răspuns, timestamp, error.
- **Mini-grafic**: % healthy în ultimele 7 zile (recharts line/area).
- Email destinatar pentru alerte: configurabil din UI, salvat în `site_settings` cu cheia `redirect_monitor_alert_email` (default: `mvaimobiliare@gmail.com` din metadata).

### 6. Buton în AdminLayout
Adaugă în meniul SEO al admin sidebar: "Monitor Redirecturi" cu badge roșu dacă există broken redirects în ultima rulare.

## Fluxul utilizatorului
1. Admin deschide `/admin/seo/redirect-monitor`.
2. Vede status: dacă toate sunt 301 → verde; dacă nu → roșu cu listă.
3. Poate adăuga URL-uri noi de testat (ex. când lansează o regulă nouă de redirect).
4. Cronul de 6h rulează în background; primește email dacă ceva se strică.

## Detalii tehnice

**Migrații DB** (2 tabele + RLS):
- `redirect_monitor_targets` — RLS: select/insert/update/delete doar pentru `has_role(auth.uid(), 'admin')`. Acces din UI prin `adminApi` (bypass RLS cu service key, conform pattern-ului existent).
- `redirect_monitor_checks` — same RLS pattern; index pe `(url_tested, checked_at DESC)` pentru query rapid.

**Edge function** `monitor-redirects/index.ts`:
- Folosește `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` pentru insert.
- `fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'MVAImobiliare-RedirectMonitor/1.0' } })`.
- Suport pentru testarea atât pe `mvaimobiliare.ro` cât și pe `www.mvaimobiliare.ro`.
- Logging detaliat în `console.log` pentru debugging.

**Email alert** (Mailgun):
- Subject: `[ALERT] X redirecturi SEO non-301 detectate`
- Body HTML cu tabel: URL testat, status așteptat, status primit, ultima dată OK.
- Link către pagina admin pentru detalii.

**Pagina admin** (`src/pages/admin/RedirectMonitor.tsx`):
- React Query cu `staleTime: 0` (real-time).
- Folosește `adminApi.invoke('monitor-redirects-data', ...)` — un edge function dedicat read-only care întoarce targets + ultimele checks.
- Buton "Run now" → `adminApi.invoke('monitor-redirects')` direct.
- Form modal pentru add/edit target (`Dialog` + `Input` shadcn).
- Tabel cu `Table` shadcn, badge verde/roșu via `Badge variant`.
- Grafic 7 zile cu recharts.

**Cron setup** (insert direct, nu migrație):
```sql
select cron.schedule(
  'monitor-redirects-6h',
  '0 */6 * * *',
  $$ select net.http_post(...) $$
);
```

## Out of scope (pot adăuga ulterior)
- SMS alerts.
- Verificare per URL real din `catalog_offers` (acum testează doar pattern-uri reprezentative — suficient pentru a detecta breakage la nivel de regulă).
- Dashboard public (rămâne admin-only).

## Estimare

~6 fișiere noi (2 migrații, 2 edge functions, 1 pagină, 1 update sidebar). Implementare într-un singur pas după aprobarea planului.
