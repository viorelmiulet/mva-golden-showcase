## Problema

În GSC apar 147 URL-uri de tip `/proprietati/{slug-vechi}` raportate ca **„Duplicat fără pagina canonică selectată de utilizator"**. Asta înseamnă că Google găsește mai multe URL-uri cu același conținut și nu reușește să identifice un canonical clar.

## Cauze identificate în cod

1. **Scriptul inline din `index.html` (liniile 55-75) suprascrie canonical-ul cu URL-ul curent din address bar** pentru orice pagină ne-admin. Asta rulează ÎNAINTE ca React Helmet să injecteze canonical-ul corect din `PropertyDetail.tsx`. Rezultat: orice variantă de slug (vechi sau corect) se „auto-canonicalizează" pe sine însăși → Google vede dubluri fără semnal de consolidare.

2. **Redirectul vechilor slug-uri se face client-side** prin `window.location.replace` în `PropertyDetail.tsx` (liniile 366-374). Googlebot vede inițial 200 OK cu conținut, nu un 301. Edge function-ul `slug-redirect.js` există dar acoperă doar cazurile cu shortId hex de 4 caractere; URL-uri cu format diferit scapă.

3. **Pentru Immoflux (`/proprietate/`)**, edge function-ul nu face redirect deloc (linia 77: „No-op"). Toate variantele de slug se servesc direct.

4. Pentru pagini Immoflux, canonical-ul în Helmet folosește URL-ul direct din `slug` parametru (linia 149), nu slug-ul canonic generat din date.

## Plan de rezolvare

### 1. Elimină overwrite-ul canonical din `index.html`
Scoate liniile care setează `link[rel="canonical"]` și `og:url` din scriptul inline. Le păstrăm doar pe `og:url` setată inițial; canonical-ul rămâne `https://mvaimobiliare.ro/` ca fallback pentru homepage, iar fiecare pagină îl suprascrie corect prin React Helmet.

### 2. Întărește 301-urile server-side în `netlify/edge-functions/slug-redirect.js`
- Pentru `/proprietati/`: dacă lookup-ul după `shortId` găsește un slug canonic diferit, deja face 301 ✓. Adaugă și un fallback: dacă slug-ul conține caractere stranii sau nu se potrivește cu niciun slug din DB → 410 Gone (sau 404).
- Pentru `/proprietate/` (Immoflux): implementează lookup real: extrage `idnum` din finalul slug-ului, apelează API-ul Immoflux (sau o cache locală) pentru a calcula slug-ul canonic, fă 301 dacă diferă.

### 3. Canonical pentru `ImmofluxPropertyDetail.tsx`
Calculează canonical-ul din datele proprietății folosind `getImmofluxPropertyUrl(property)` în loc să refolosească `slug` din URL.

### 4. Verificare
După deploy:
- Inspectează 2-3 URL-uri afectate în GSC cu „URL Inspection" → verifică „User-declared canonical" vs „Google-selected canonical".
- Cere reindexare pentru slug-urile canonice.
- Așteaptă 2-4 săptămâni pentru ca Google să reproceseze cele 147 URL-uri.

## Fișiere modificate

- `index.html` — scoate suprascrierea canonical din scriptul inline
- `netlify/edge-functions/slug-redirect.js` — adaugă 301 pentru Immoflux + 410 pentru slug-uri inexistente
- `src/pages/ImmofluxPropertyDetail.tsx` — folosește `getImmofluxPropertyUrl(property)` pentru canonical
