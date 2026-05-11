## De ce apar aceste URL-uri în „Pagină cu redirecționare"

**Pe scurt: nu sunt erori reale.** Google Search Console raportează URL-uri pe care le-a descoperit anterior și care acum returnează un **301 către versiunea canonică**. Sunt excluse din index pentru că versiunea canonică (slug-ul nou) este indexată în locul lor — exact cum trebuie.

### Cauzele concrete pentru fiecare tip de URL din captură

1. **Slug-uri vechi care au fost regenerate** (ex. `garsoniera-militari-b480`)
   - În DB acum slug-ul este `garsoniera-35mp-bucuresti-militari-b480`.
   - `netlify/edge-functions/slug-redirect.js` face 301 către slug-ul curent (lookup după ultimele 4 caractere = short ID).
   - Google a crawlat varianta veche, a primit 301, marchează URL-ul vechi ca „cu redirecționare".

2. **URL-uri cu UUID** (ex. `/proprietati/91d52384-...`, `/proprietati/56f7286e-...`)
   - Sunt linkuri vechi (înainte să existe slug-uri SEO).
   - `SEORedirects` (client) + `slug-redirect` (edge) le 301-ează la slug.
   - Acele 2 UUID-uri din captură nici nu mai există în DB — sunt linkuri foarte vechi pe care Google le mai ține în istoric.

3. **`https://mvaimobiliare.ro/`** apare pentru că aliasul `www` → non-www face 301 (sau invers, în funcție de variantă).

### Concluzie

- **Nu e un bug** și nu afectează SEO negativ. Dimpotrivă, 301 consolidează autoritatea pe slug-ul canonic.
- Vor dispărea treptat din raport pe măsură ce Google reprocessează (de obicei 1–3 luni de la ultimul crawl al variantei vechi).
- Raportul „Pagini indexate" rămâne corect — versiunea canonică e cea indexată.

---

## Ce putem face ca să accelerăm curățarea (opțional)

Dacă vrei să dispară mai repede din raport:

### A. Curățare proactivă (recomandat)
1. **Verifică sitemap-urile** — confirmăm că NU apar slug-uri vechi sau UUID-uri (deja așa stăm: `generate-sitemap-properties` filtrează doar slug-uri active).
2. **Audit linkuri interne** — căutăm în cod / blog / news referințe hardcodate către vechile slug-uri sau UUID-uri și le înlocuim cu slug-ul curent.
3. **Adaugă `Cache-Control: public, max-age=31536000, immutable`** pe răspunsurile 301 — deja făcut în `slug-redirect.js`. ✓

### B. Reducerea numărului de slug-uri schimbate în viitor
- Trigger-ul `auto_generate_property_slug` regenerează slug-ul când se schimbă `title`/`location`. Putem adăuga o condiție: regenerăm doar dacă slug-ul curent e gol sau dacă schimbarea e majoră (păstrăm slug-ul stabil când doar prețul/descrierea se actualizează).
- Asta ar tăia drastic noile redirecționări apărute în GSC.

### C. URL-uri cu UUID din linkuri externe vechi
- Nu putem face nimic dacă alte site-uri linkează cu UUID — 301-ul nostru e răspunsul corect.
- Eventual: marcăm URL-urile UUID cu `X-Robots-Tag: noindex` în edge function (în plus față de 301), ca semnal mai clar.

---

## Ce decizie aștept de la tine

Spune-mi dacă vrei să implementez (în build mode):

1. **Stabilizare slug-uri** — modificăm trigger-ul ca să nu regenereze slug-ul când proprietatea există deja cu un slug valid (cea mai mare sursă de redirecționări).
2. **Audit + curățare linkuri interne vechi** — scanez `blog_posts.content`, `news_articles.content`, componente, ca să înlocuiesc vechile slug-uri.
3. **Doar lăsăm așa** — Google va consolida natural, fără acțiune.

Sau o combinație. Care variantă?