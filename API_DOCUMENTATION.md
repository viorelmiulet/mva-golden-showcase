# Documentația API MVA Imobiliare

## Autentificare
Pentru toate cererile trebuie să incluzi header-ul de autentificare:
```
x-api-key: mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY
```

## URL de Bază
```
https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api
```

## Endpoint-uri Disponibile

### 1. Obținere Oferte
**GET** `/offers`

Obține lista ofertelor disponibile cu filtrare și paginare.

**Parametri query opționali:**
- `limit` (number) - Numărul maxim de rezultate (default: 50)
- `offset` (number) - Numărul de rezultate de omis (default: 0)
- `location` (string) - Filtru după locație
- `min_price` (number) - Prețul minim
- `max_price` (number) - Prețul maxim
- `rooms` (number) - Numărul de camere
- `featured` (boolean) - Doar ofertele recomandate

**Exemplu request:**
```javascript
fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers?limit=10&location=Militari', {
  headers: {
    'x-api-key': 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
  }
})
```

**Răspuns de succes:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Apartament 2 camere modern",
      "description": "Apartament nou cu finisaje premium",
      "location": "Militari, București",
      "price_min": 65000,
      "price_max": 70000,
      "surface_min": 45,
      "surface_max": 50,
      "rooms": 2,
      "currency": "EUR",
      "images": ["url1.jpg", "url2.jpg"],
      "features": ["Balcon", "Parcare"],
      "amenities": ["Aer condiționat"],
      "availability_status": "available",
      "is_featured": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

### 2. Creare Ofertă Nouă
**POST** `/offers`

Adaugă o ofertă nouă în catalog.

**Câmpuri obligatorii:**
- `title` (string) - Titlul ofertei
- `description` (string) - Descrierea ofertei  
- `location` (string) - Locația
- `price_min` (number) - Prețul minim
- `rooms` (number) - Numărul de camere

**Câmpuri opționale:**
- `price_max` (number) - Prețul maxim
- `surface_min` (number) - Suprafața minimă (mp)
- `surface_max` (number) - Suprafața maximă (mp)
- `currency` (string) - Moneda (default: "EUR")
- `project_name` (string) - Numele proiectului
- `images` (array) - Array cu URL-uri imagini
- `features` (array) - Array cu caracteristici
- `amenities` (array) - Array cu facilități
- `availability_status` (string) - Status disponibilitate (default: "available")
- `is_featured` (boolean) - Dacă e ofertă recomandată
- `contact_info` (object) - Informații de contact
- `storia_link` (string) - Link către Storia
- `whatsapp_catalog_id` (string) - ID catalog WhatsApp

**Exemplu request:**
```javascript
fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
  },
  body: JSON.stringify({
    title: "Apartament 2 camere Militari",
    description: "Apartament modern cu 2 camere în zona Militari",
    location: "Militari, București",
    price_min: 75000,
    price_max: 80000,
    surface_min: 52,
    surface_max: 55,
    rooms: 2,
    currency: "EUR",
    project_name: "Complex Militari Residence",
    images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    features: ["Balcon", "Parcare", "Lift"],
    amenities: ["Aer condiționat", "Termopane"],
    is_featured: false
  })
})
```

**Răspuns de succes (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Apartament 2 camere Militari",
    "description": "Apartament modern cu 2 camere în zona Militari",
    "location": "Militari, București",
    "price_min": 75000,
    "price_max": 80000,
    "surface_min": 52,
    "surface_max": 55,
    "rooms": 2,
    "currency": "EUR",
    "project_name": "Complex Militari Residence",
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "features": ["Balcon", "Parcare", "Lift"],
    "amenities": ["Aer condiționat", "Termopane"],
    "availability_status": "available",
    "is_featured": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Offer created successfully"
}
```

### 3. Actualizare Ofertă
**PUT** `/offers/{id}`

Actualizează o ofertă existentă. Doar câmpurile furnizate vor fi actualizate.

**URL Parameters:**
- `id` (string) - UUID-ul ofertei de actualizat

**Exemplu request:**
```javascript
fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers/550e8400-e29b-41d4-a716-446655440000', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
  },
  body: JSON.stringify({
    price_min: 78000,
    price_max: 82000,
    is_featured: true
  })
})
```

**Răspuns de succes:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Apartament 2 camere Militari",
    // ... restul câmpurilor actualizate
  },
  "message": "Offer updated successfully"
}
```

### 4. Ștergere Ofertă
**DELETE** `/offers/{id}`

Șterge o ofertă din catalog.

**URL Parameters:**
- `id` (string) - UUID-ul ofertei de șters

**Exemplu request:**
```javascript
fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers/550e8400-e29b-41d4-a716-446655440000', {
  method: 'DELETE',
  headers: {
    'x-api-key': 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
  }
})
```

**Răspuns de succes:**
```json
{
  "success": true,
  "message": "Offer deleted successfully"
}
```

### 5. Obținere Proiecte
**GET** `/projects`

Obține lista proiectelor imobiliare.

**Parametri query opționali:**
- `limit` (number) - Numărul maxim de rezultate (default: 50)
- `offset` (number) - Numărul de rezultate de omis (default: 0)
- `location` (string) - Filtru după locație
- `status` (string) - Status proiect (default: "available")

**Exemplu request:**
```javascript
fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/projects', {
  headers: {
    'x-api-key': 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
  }
})
```

### 6. Statistici
**GET** `/stats`

Obține statistici generale despre oferte și proiecte.

**Exemplu request:**
```javascript
fetch('https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/stats', {
  headers: {
    'x-api-key': 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
  }
})
```

**Răspuns de succes:**
```json
{
  "success": true,
  "data": {
    "total_offers": 25,
    "total_projects": 3,
    "featured_offers": 5,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Coduri de Eroare

- **400 Bad Request** - Date invalide sau câmpuri lipsă
- **401 Unauthorized** - API key invalid sau lipsă
- **404 Not Found** - Resursa nu a fost găsită
- **500 Internal Server Error** - Eroare de server

**Format eroare:**
```json
{
  "success": false,
  "error": "Mesajul de eroare",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Exemple de Cod

### JavaScript/Node.js
```javascript
const apiKey = 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY';
const baseUrl = 'https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api';

// Creează o ofertă nouă
async function createOffer(offerData) {
  const response = await fetch(`${baseUrl}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(offerData)
  });
  
  return await response.json();
}

// Obține oferte
async function getOffers(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${baseUrl}/offers?${params}`, {
    headers: {
      'x-api-key': apiKey
    }
  });
  
  return await response.json();
}
```

### Python
```python
import requests
import json

API_KEY = 'mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY'
BASE_URL = 'https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api'

def create_offer(offer_data):
    response = requests.post(
        f'{BASE_URL}/offers',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        json=offer_data
    )
    return response.json()

def get_offers(filters=None):
    response = requests.get(
        f'{BASE_URL}/offers',
        headers={'x-api-key': API_KEY},
        params=filters or {}
    )
    return response.json()
```

### cURL
```bash
# Creează ofertă
curl -X POST https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers \
  -H "Content-Type: application/json" \
  -H "x-api-key: mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY" \
  -d '{
    "title": "Apartament 2 camere",
    "description": "Apartament modern",
    "location": "București",
    "price_min": 65000,
    "rooms": 2
  }'

# Obține oferte
curl -X GET "https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers?limit=5" \
  -H "x-api-key: mva_8rWiKkQW7WhfjIonljmtI1K3p1QrrevY"
```

## Limite și Restricții

- **Rate limiting**: Maxim 100 cereri pe minut per API key
- **Dimensiune payload**: Maxim 10MB per cerere
- **Autentificare**: API key-ul este obligatoriu pentru toate cererile
- **Imagini**: URL-urile imaginilor trebuie să fie valide și accesibile public

## Suport

Pentru întrebări despre API sau probleme tehnice:
- Email: support@mva-imobiliare.ro
- Telefon: +40 767 941 512
- WhatsApp: https://wa.me/40767941512