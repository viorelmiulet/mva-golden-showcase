## Diagnostic

**Eroare 1 — „Excluse pe baza etichetei noindex" (8 URL-uri)**
URL-uri tip `https://mvaimobiliare.ro/proprietati/apartament-2-camere-militari-9275` etc.

Cauza: ruta `/proprietati/:slug` este servită de `PropertyDetail.tsx` (catalog), care:
1. Ia ultimele 4 caractere ca short-id hex (`9275`, `9468` etc.)
2. Caută în `catalog_offers` prin `find_properties_by_id_prefix`
3. Dacă nu găsește → afișează `NotFound`, care are `<meta name="robots" content="noindex, follow" />`

Sufixurile `9275`, `9468`, `7917` sunt numerice — par să fie de fapt **idnum-uri Immoflux** (ruta corectă ar fi `/proprietate/:slug`). Crawlerul (Prerender.io) primește atunci pagina NotFound cu `noindex` și o raportează ca atare. În plus, slug-redirect.js (Netlify edge) nu rezolvă cazul Immoflux pe ruta catalog.

**Eroare 2 — „Pagină alternativă cu etichetă canonică corespunzătoare" (5 URL-uri)**
Acestea sunt informative — Google a găsit duplicate care pointează corect la canonical (ex. URL-uri vechi cu sufix scurt). Nu e o eroare critică, dar putem reduce zgomotul forțând 301 server-side pentru sufixele numerice.

## Modificări

### 1. `src/pages/PropertyDetail.tsx` — fallback către Immoflux

În `fetchProperty()`, înainte de `setNotFound(true)`:
- Dacă slug-ul are sufix pur numeric (`/(\d{3,})$/`), face un `301 redirect` către `/proprietate/<slug>` (păstrând slug-ul, ImmofluxPropertyDetail știe să extragă idnum-ul).
- Folosește `window.location.replace` pentru a evita o intrare în istoric.

Astfel, `/proprietati/apartament-2-camere-militari-9275` → `/proprietate/apartament-2-camere-militari-9275`, care servește pagina reală cu `index, follow`.

### 2. `netlify/edge-functions/slug-redirect.js` — 301 server-side pentru bots

În blocul `isCatalog`: dacă short-id-ul este pur numeric și lookup-ul în `catalog_offers` nu găsește nimic, returnează `301` direct la `/proprietate/<slug>` (idnum extras = sufixul numeric). Acest pas e cheia: Prerender.io cache-uiește răspunsul 301 → bot-ul nu mai vede pagina cu `noindex`.

### 3. `src/pages/NotFound.tsx` — întoarce 404 propriu (opțional)

Lăsăm `noindex` pe NotFound (corect), dar adăugăm `<meta http-equiv="status" content="404">` pentru claritate. Nu schimbăm comportamentul — doar documentăm.

### 4. Invalidare cache Prerender.io

După deploy, instrucțiuni pentru user: re-trimite cele 8 URL-uri în GSC („Solicitați indexarea") + cere recrawl Prerender.io (sau șterge cache pentru cele 8 URL-uri din dashboard-ul Prerender). Fără asta, Google va vedea în continuare versiunea cache-uită cu noindex pentru câteva zile.

## Riscuri

- Niciun risc pentru URL-urile actuale catalog (sufix hex valid în DB → match exact în pasul 2 al `fetchProperty`).
- Redirectul Immoflux se aplică DOAR când short-id-ul nu există în catalog, deci nu poluează rutele existente.
- Redirectul în Netlify rulează doar pentru sufixe pur numerice, deci slug-uri hex valide rămân neafectate.

## Verificare

După implementare:
1. Vizităm direct unul dintre URL-urile raportate (ex. `/proprietati/apartament-2-camere-militari-9275`) → trebuie să se redirecționeze la `/proprietate/...-9275` și să afișeze pagina reală.
2. `curl -I -A "Googlebot" https://mvaimobiliare.ro/proprietati/apartament-2-camere-militari-9275` → trebuie să returneze `301`.
3. În GSC, validăm fix-ul pe ambele rapoarte.
