## Context

Sunt 61 de funcții edge, ~14.900 linii de cod Deno. Nu pot fi mutate corect într-o singură trecere: fiecare are secrete, CORS, autentificare și consumatori externi proprii. Propun o migrare pe 5 valuri, fiecare val fiind livrat și verificat separat, fără downtime.

## Principii

- Rutele publice existente rămân funcționale: pentru orice funcție cu URL fix apelat din exterior (webhook-uri, feed-uri, extensia Chrome, cron), funcția Supabase rămâne live până când noul endpoint TanStack e publicat și verificat, apoi devine un simplu proxy care redirecționează spre noul endpoint.
- Logică internă (apelată doar din `src/`) → `createServerFn` în `src/lib/*.functions.ts` + helperi în `*.server.ts`.
- Endpointuri HTTP externe → rute server sub `src/routes/api/public/*`, cu aceeași verificare de semnătură/cheie ca acum.
- Deno API (`Deno.env`, `npm:` imports) se traduc în `process.env` citit în handler și pachete npm bundle-uite compatibile Workers.

## Valul 1 — SEO & conținut public (8 funcții)

`generate-sitemap`, `-index`, `-static`, `-properties`, `-complexes`, `-images`, `-immoflux`, `generate-news-sitemap`

Devin rute server SSR (`src/routes/sitemap[.]xml.tsx` etc.) generate direct din baza de date, cu `Content-Type: application/xml`. Câștig imediat: sitemap-urile se servesc de pe domeniul propriu, nu de pe URL-uri de funcții.

## Valul 2 — Funcții interne fără efecte externe (≈20 funcții)

`admin-offers`, `admin-complexes`, `api-keys-manager`, `google-reviews`, `immoflux-proxy`, `mapbox-token`, `fix-property-zones`, `monitor-redirects`, `lighthouse-report`, `plausible-analytics`, `update-floor-plan`, `update-project-image`, `notify-google-sitemap`, `extract-company-data`, `extract-id-data`, `ai-property-recommendations`, `generate-facebook-content`, `scrape-property`, `virtual-staging`, `generate-furnished-images`.

Fiecare devine `createServerFn`; apelurile `supabase.functions.invoke(...)` din admin se înlocuiesc cu apel tipizat. Accesul admin rămâne pe același model de parolă/serviciu ca acum.

## Valul 3 — Email & contracte (10 funcții)

`send-contact-email`, `send-job-application`, `send-collaboration-email`, `send-viewing-notification`, `send-transactional-email`, `reply-email`, `send-conversations`, `send-signature-link`, `notify-contract-signed`, `auto-generate-signed-contract`.

Router de email partajat în `src/lib/email.server.ts` (Mailgun). `auth-email-hook`, `receive-mailgun-email` și `process-email-queue` rămân pe Supabase în acest val — sunt legate de hook-uri Supabase/Mailgun și de `pg_cron`; se mută în valul 5.

## Valul 4 — Import & sincronizare (9 funcții)

`sync-immoflux`, `immoflux-integration`, `import-complexes-excel`, `import-complexes-pdf`, `import-excel-apartments`, `import-renew-apartments`, `facebook-catalog-import`, `social-auto-post`, `scheduled-social-post`.

Atenție: `xlsx` și parsarea PDF trebuie verificate pentru compatibilitate Workers; unde nu merg, procesarea se face client-side în admin, iar server function-ul primește date deja parsate.

## Valul 5 — Endpointuri cu URL fix / consumatori externi (14 funcții)

`fb-queue`, `immoflux-webhook`, `marketing-webhook`, `receive-mailgun-email`, `auth-email-hook`, `track`, `og-image`, `og-meta`, `facebook-catalog-feed`, `mcp`, `process-email-queue`, `process-sitemap-queue`, `chat-assistant`, `elevenlabs-conversation-token`.

Se mută sub `src/routes/api/public/*`, apoi:
1. se publică noul endpoint,
2. se actualizează consumatorii (extensia Chrome, Immoflux, Make.com, Mailgun, `pg_cron`),
3. funcția veche devine proxy 307 timp de o perioadă,
4. abia apoi se șterge.

`og-meta`/`og-image` pot dispărea complet — SSR-ul TanStack livrează deja meta tag-urile reale.

## Detalii tehnice

- `Deno.serve` → `createFileRoute(...).server.handlers`
- `Deno.env.get("X")` → `process.env.X`, citit **în interiorul** handler-ului
- `createClient(..., SERVICE_ROLE)` → `await import("@/integrations/supabase/client.server")` în handler
- CORS: doar pentru rutele `api/public/*` chemate cross-origin
- Fiecare val se încheie cu build verde, typecheck curat și probe `curl` pe endpointurile noi înainte de a atinge funcția veche.

## Ce livrez acum, dacă aprobi

Valul 1 (sitemap-uri) integral, plus scheletul comun (`src/lib/*.server.ts` pentru Supabase admin și email), ca următoarele valuri să fie rapide.
