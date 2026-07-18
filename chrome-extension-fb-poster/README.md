# MVA Facebook Group Poster

Extensie Chrome (Manifest V3) care postează automat oferte imobiliare MVA în grupuri Facebook, consumând coada `fb-queue` (edge function).

## Instalare

1. Deschide `chrome://extensions` în Chrome (sau orice browser Chromium: Edge, Brave, Arc, Opera).
2. Activează **Developer mode** (colțul dreapta sus).
3. Click **Load unpacked** și selectează folderul `chrome-extension-fb-poster/`.
4. Fixează extensia în bara de instrumente (opțional).

## Configurare

1. Click pe iconița extensiei → **⚙️ Setări**.
2. Completează:
   - **URL Edge Function** — baza (fără `/next` sau `/result`), ex: `https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/fb-queue`
   - **API Key** — valoarea `FB_QUEUE_API_KEY` (aceeași salvată în edge function secrets)
   - **Delay minim / maxim (min)** — pauza aleatoare între postări
   - **Max postări/zi** — limită de siguranță
3. Salvează.
4. Deschide popup-ul și apasă **Pornește**.

## Utilizare

- Extensia rulează în fundal și verifică la fiecare 2 minute dacă are joburi noi în coadă.
- Când găsește un job:
  1. Deschide grupul Facebook într-un tab inactiv.
  2. Așteaptă ca pagina să se încarce, deschide compositor-ul.
  3. Lipește mesajul generat de admin (`fb_post_queue.message`).
  4. Așteaptă preview-ul linkului și apasă **Postează**.
  5. Raportează rezultatul la `fb-queue/result`.
  6. Închide tabul și programează următoarea rulare la un delay aleator.

- **Grupurile țintă** se gestionează din admin, la `/admin/facebook-groups`.
- **Coada** se monitorizează la `/admin/facebook-queue`.

## Note

- Trebuie să fii logat pe Facebook în același Chrome unde e instalată extensia.
- Facebook își schimbă frecvent DOM-ul — dacă selectorii nu mai găsesc compositor-ul sau butonul „Postează", verifică log-ul din popup și ajustează `content.js`.
- Nu depăși limitele Facebook (recomandat < 15 postări/zi/cont).
