# MVA Admin — Extensie Chrome

Extensie Chrome pentru notificări push când apar emailuri noi sau vizionări programate în panoul de administrare MVA.

## Funcționalități

- 📧 **Notificări emailuri noi** — din tabelul `received_emails` (necitite, neșterse, nearhivate)
- 📅 **Notificări vizionări noi** — din tabelul `viewing_appointments`
- 🔢 **Badge count** — număr de emailuri necitite pe iconița extensiei (culoare #DAA520)
- 🚀 **Acces rapid** — meniu complet către toate secțiunile admin
- ⚙️ **Control notificări** — activează/dezactivează din popup
- 🔄 **Polling la 60 secunde** — verificare automată fără duplicate

## Instalare

### 1. Pregătire fișiere

Asigură-te că ai iconițe PNG în folderul `icons/`:
- `icon16.png` — 16×16 px
- `icon48.png` — 48×48 px
- `icon128.png` — 128×128 px

### 2. Configurare Supabase (opțional — deja configurat)

Extensia vine pre-configurată cu URL-ul și cheia anonimă Supabase. Dacă vrei să le schimbi:

1. Deschide `background.js` și `popup.js`
2. Modifică `SUPABASE_URL` cu URL-ul proiectului tău Supabase
3. Modifică `SUPABASE_ANON_KEY` cu cheia anonimă (publishable key) — o găsești în **Project Settings → API → Project API keys → anon / public**

> ⚠️ Cheia anonimă (anon key) este sigură pentru utilizare client-side. Nu folosi niciodată `service_role` key în extensie.

### 3. Încărcare în Chrome

1. Deschide Chrome și navighează la `chrome://extensions/`
2. Activează **Developer mode** (toggle dreapta sus)
3. Click pe **Load unpacked**
4. Selectează folderul `chrome-extension/` din proiect
5. Extensia apare în bara de instrumente Chrome

### 4. Fixare în bară (recomandat)

1. Click pe iconița puzzle 🧩 din dreapta barei de adrese
2. Găsește „MVA Admin Panel" și apasă pe 📌 (pin)

## Cum funcționează

| Ce verifică | Tabel Supabase | Filtru | La click |
|---|---|---|---|
| Emailuri noi | `received_emails` | `is_read=false`, `is_deleted=false`, `is_archived=false` | Deschide `/admin/inbox` |
| Vizionări noi | `viewing_appointments` | `created_at > ultimul check` | Deschide `/admin/vizionari` |

- Polling interval: **60 secunde**
- Fără duplicate: timestamp-ul ultimei notificări e salvat în `chrome.storage.local`
- Badge pe iconiță: afișează nr. emailuri necitite, culoare auriu (#DAA520)

## Structura fișierelor

```
chrome-extension/
├── manifest.json      # Manifest V3
├── background.js      # Service worker — polling + notificări
├── popup.html         # Interfața popup
├── popup.js           # Logica popup-ului
├── icons/             # Iconițe PNG
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Compatibilitate

Funcționează pe orice browser bazat pe Chromium:
- Google Chrome
- Microsoft Edge
- Brave
- Arc
- Opera

## Permisiuni

| Permisiune | De ce |
|---|---|
| `notifications` | Afișare notificări push |
| `alarms` | Verificare periodică (polling) |
| `storage` | Salvare setări și timestamps |
| `host_permissions` | Acces API Supabase |
