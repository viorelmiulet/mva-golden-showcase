# Audit complet SSR al rutelor publice

## Scop
Livrez exclusiv un raport; nu modific surse, rute, date sau configurații.

## Raportul va include
1. Un inventar al tuturor rutelor publice din arborele TanStack, separat de rutele admin/API, cu:
   - existența și rolul loader-ului server-side;
   - existența metadatelor `head()` în HTML-ul serverului;
   - prezența conținutului principal în HTML-ul inițial;
   - marcarea explicită a fiecărui răspuns „Nu”, inclusiv redirecturi și rute dinamice evaluate pe exemple reale.
2. Analiza paginilor `/militari-residence`, `/renew-residence` și `/eurocasa-residence`:
   - componenta și sursa datelor;
   - conținut editorial unic față de `/complexe/{slug}`;
   - suprapuneri, canonical și sitemap;
   - verificarea în baza de date a slugurilor ansamblurilor și a inventarului asociat.
3. Verificarea SSR pentru rutele nominalizate: chirii, comparație, pagini editoriale, carieră, știri și blog.
4. Comparația exactă dintre `/chirii-militari-residence` și `/chirie-militari-residence`, inclusiv faptul că a doua este o rută dinamică de landing și comportamentul ei în funcție de inventar.
5. Auditul structurii blogului: categorii, `category_id`, lipsa sau existența tagurilor și a relațiilor explicite cu zone/ansambluri, plus ce contextualizare este posibilă fără date noi.

## Metodă tehnică
- Corelez declarațiile din `src/routes`, componentele randate și sursele de date.
- Verific HTML-ul publicat prin cereri HTTP directe, nu doar existența codului.
- Interoghez schema și înregistrările relevante din backend numai în mod read-only.
- Citez fișierele și liniile relevante și disting între conținut SSR real, shell SSR și conținut apărut doar după hidratare.
