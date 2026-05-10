## Feed CSV pentru Facebook Catalog

Generez un endpoint public care servește un CSV în formatul standard Facebook Catalog, gata de adăugat ca "Data feed" în Meta Commerce Manager (cu refresh programat).

### 1. Edge Function: `facebook-catalog-feed`

**Path public**: `https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/facebook-catalog-feed`

- `verify_jwt = false` în `supabase/config.toml` (feed public, accesat de Facebook fără auth)
- Folosește `SUPABASE_SERVICE_ROLE_KEY` pentru a citi `catalog_offers`
- Filtrare:
  - `is_published = true`
  - `availability_status IN ('available','reserved','sold')` (toate publicate)
  - `project_id IS NULL` → **exclude apartamentele din ansambluri rezidențiale**
  - exclude rânduri fără preț valid sau fără imagine
- Returnează `Content-Type: text/csv; charset=utf-8` cu `Cache-Control: public, max-age=1800`

**Coloane CSV (standard Facebook):**
```
id,title,description,availability,condition,price,link,image_link,
additional_image_link,brand,google_product_category,product_type
```

**Mapare:**
- `id` → `external_id` sau `id` (UUID)
- `title` → `title` (max 150 caractere, fără ghilimele duble interne)
- `description` → `description` sau `descriere_lunga` (strip HTML, max 5000)
- `availability` → `in stock` (available) / `out of stock` (sold/reserved)
- `condition` → `new`
- `price` → `"<price_min> EUR"` (format Facebook: `120000.00 EUR`)
- `link` → `https://www.mvaimobiliare.ro/proprietati/<slug>`
- `image_link` → prima imagine din `images[]`
- `additional_image_link` → restul imaginilor concatenate cu `,` (max 10)
- `brand` → `MVA Imobiliare`
- `google_product_category` → `Real Estate`
- `product_type` → `<property_type> > <rooms> camere > <city>`

**Escape CSV**: orice valoare cu `,`, `"`, newline → înconjurată cu `"` și `"` interne dublate. Newlines din descriere înlocuite cu spațiu.

### 2. Pagina admin: `/admin/facebook-catalog-feed`

Componentă nouă `src/pages/admin/FacebookCatalogFeedPage.tsx` cu:

- Card cu URL-ul feed-ului + buton **Copiază link**
- Buton **Deschide CSV** (download)
- Buton **Preview** care afișează primele 5 produse într-un tabel
- Statistici live (apel HEAD/GET la endpoint):
  - Număr total produse exportate
  - Mărime fișier
  - Ultima generare (timestamp din răspuns)
- Instrucțiuni scurte: "Adaugă acest URL în Meta Commerce Manager → Catalog → Data Sources → Scheduled Feed → Daily"
- Link în `AdminSidebar` sub secțiunea Marketing/Integrări: "Feed Facebook Catalog" (icon `FileSpreadsheet`)
- Rută în `App.tsx` (lazy)

### 3. Fișiere

**Noi:**
- `supabase/functions/facebook-catalog-feed/index.ts`
- `src/pages/admin/FacebookCatalogFeedPage.tsx`

**Modificate:**
- `supabase/config.toml` — adaugă `[functions.facebook-catalog-feed] verify_jwt = false`
- `src/App.tsx` — rută nouă `/admin/facebook-catalog-feed`
- `src/components/AdminSidebar.tsx` — link nou

### Out of scope
- Webhook/sincronizare push către Facebook API (feed-ul e pull-based, Facebook îl reia automat după programare)
- Custom labels (camere/zonă/tranzacție) — rămân pentru o iterație ulterioară dacă e nevoie de targetare avansată
