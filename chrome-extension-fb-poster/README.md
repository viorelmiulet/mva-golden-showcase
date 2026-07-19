# MVA Facebook Group Poster

Extensie Chrome (Manifest V3) care preia oferte imobiliare din coada `fb-queue` și le publică automat în grupuri Facebook.

## Instalare

1. Deschide `chrome://extensions` în Chrome (sau Edge / Brave / Arc).
2. Activează **Developer mode** (colțul dreapta-sus).
3. Apasă **Load unpacked** și selectează folderul `chrome-extension-fb-poster/`.
4. Deschide **Setări** (din popup) și completează:
   - **Edge URL** — endpoint-ul `fb-queue` (implicit corect).
   - **API Key** — cheia `X-Api-Key` din admin.
   - **Delay minim / maxim** (minute) între postări.
   - **Maxim postări/zi**.
5. Din popup, apasă comutatorul **Automatizare** pentru a porni.

## Grupuri țintă

Grupurile în care se postează se gestionează exclusiv din admin, la
**`/admin/facebook-groups`**. Extensia primește automat lista prin coadă.

## Rezistență la închiderea worker-ului

Chrome oprește agresiv service worker-ii MV3. Extensia rezistă prin:

- un singur alarm periodic `mva-tick` (la 2 minute), niciodată recreat cu delay;
- distanța dintre postări este persistată în `chrome.storage.local` prin
  `nextAllowedAt` — nu prin alarme înlănțuite;
- flag-ul `busySince` este un timestamp; valorile mai vechi de 3 minute sunt
  considerate „worker mort" și ignorate.

## Depanare

- Verifică log-ul din popup (ultimele 50 evenimente).
- Dacă butonul „Postează" din Facebook rămâne dezactivat, verifică formatul
  mesajului sau așteaptă generarea preview-ului de link.
