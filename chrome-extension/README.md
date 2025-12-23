# MVA Admin - Extensie Chrome

Extensie Chrome pentru notificări și acces rapid la panoul de administrare MVA.

## Funcționalități

- 🔔 **Notificări automate** pentru vizionări noi și clienți noi
- 📊 **Statistici rapide** - vizionări de azi și clienți noi
- 🚀 **Acces rapid** la panoul de administrare
- ⚙️ **Control notificări** - activează/dezactivează din popup

## Instalare

### Metoda 1: Încărcare ca extensie nepachetată (Development)

1. Deschide Chrome și navighează la `chrome://extensions/`
2. Activează **Developer mode** (colțul dreapta sus)
3. Click pe **Load unpacked**
4. Selectează folderul `chrome-extension` din proiect
5. Extensia va apărea în bara de instrumente Chrome

### Metoda 2: Publicare în Chrome Web Store

1. Creează un cont de dezvoltator la [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Arhivează folderul `chrome-extension` ca ZIP
3. Încarcă arhiva în dashboard
4. Completează descrierea și capturile de ecran
5. Trimite pentru revizuire

## Structura fișierelor

```
chrome-extension/
├── manifest.json      # Configurația extensiei
├── background.js      # Service worker pentru notificări
├── popup.html         # Interfața popup
├── popup.js          # Logica popup-ului
├── icons/            # Iconițe pentru extensie
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Configurare icoane

Trebuie să adaugi 3 icoane PNG în folderul `icons/`:

- `icon16.png` - 16x16 pixeli
- `icon48.png` - 48x48 pixeli  
- `icon128.png` - 128x128 pixeli

Poți folosi logo-ul MVA sau creezi icoane noi.

## Cum funcționează

1. Extensia verifică la fiecare 5 minute pentru:
   - Vizionări noi programate
   - Clienți noi adăugați

2. Când detectează ceva nou, trimite o notificare Chrome

3. Click pe notificare → deschide pagina relevantă din admin

## Permisiuni necesare

- `notifications` - pentru a afișa notificări
- `alarms` - pentru verificări periodice
- `storage` - pentru salvarea setărilor
- `host_permissions` - acces la API-ul Supabase
