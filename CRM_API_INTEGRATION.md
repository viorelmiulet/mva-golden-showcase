# CRM API Integration - MVA Imobiliare

## Descriere Generală

Această documentație descrie cum să integrezi CRM-ul tău cu platforma MVA Imobiliare pentru sincronizarea automată a proprietăților.

## Endpoint-uri API Disponibile

### Base URL
```
https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api
```

### Autentificare

Toate cererile necesită header-ul `x-api-key` cu API key-ul generat din platforma MVA.

```bash
x-api-key: mva_your-api-key-here
```

## Endpoint pentru Proprietăți din CRM

### POST /offers - Creeare Proprietate din CRM

Endpoint pentru trimiterea proprietăților din CRM către platforma MVA.

**URL:** `POST /offers`

**Headers obligatorii:**
```
Content-Type: application/json
x-api-key: mva_your-api-key-here
```

**Body (JSON):**

#### Câmpuri Obligatorii:
- `title` (string) - Titlul proprietății
- `description` (string) - Descrierea detaliată
- `location` (string) - Locația proprietății
- `price_min` (number) - Prețul minim în EUR
- `rooms` (number) - Numărul de camere
- `source` (string) - Trebuie setat pe "crm" pentru proprietăți din CRM

#### Câmpuri Opționale:
- `price_max` (number) - Prețul maxim în EUR
- `surface_min` (number) - Suprafața minimă în mp
- `surface_max` (number) - Suprafața maximă în mp
- `project_name` (string) - Numele proiectului
- `images` (array) - Array cu URL-uri la imagini
- `features` (array) - Array cu caracteristicile proprietății
- `amenities` (array) - Array cu facilitățile
- `availability_status` (string) - Status: "available", "sold", "reserved"
- `currency` (string) - Moneda (default: "EUR")
- `is_featured` (boolean) - Dacă proprietatea este evidențiată

## Exemple de Integrare

### 1. Exemplu cURL

```bash
curl -X POST "https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers" \
  -H "Content-Type: application/json" \
  -H "x-api-key: mva_your-api-key-here" \
  -d '{
    "title": "Apartament 2 camere Militari",
    "description": "Apartament modern cu 2 camere în zona Militari Residence",
    "location": "București, Militari",
    "price_min": 75000,
    "price_max": 75000,
    "surface_min": 55,
    "surface_max": 55,
    "rooms": 2,
    "source": "crm",
    "images": [
      "https://your-crm.com/images/property1/image1.jpg",
      "https://your-crm.com/images/property1/image2.jpg"
    ],
    "features": ["Balcon", "Parcare", "Lift"],
    "amenities": ["Centrală termică", "Aer condiționat"],
    "availability_status": "available",
    "is_featured": false
  }'
```

### 2. Exemplu PHP

```php
<?php

function sendPropertyToMVA($propertyData, $apiKey) {
    $url = 'https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers';
    
    // Asigură-te că sursa este setată pe "crm"
    $propertyData['source'] = 'crm';
    
    $headers = [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($propertyData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'success' => $httpCode === 201,
        'response' => json_decode($response, true),
        'http_code' => $httpCode
    ];
}

// Exemplu de utilizare
$propertyData = [
    'title' => 'Apartament 3 camere Chiajna',
    'description' => 'Apartament spațios cu 3 camere în complex rezidențial nou',
    'location' => 'Chiajna, Ilfov',
    'price_min' => 120000,
    'rooms' => 3,
    'surface_min' => 75,
    'images' => [
        'https://your-crm.com/images/property/1.jpg',
        'https://your-crm.com/images/property/2.jpg'
    ],
    'features' => ['Balcon', 'Parcare subterană', 'Lift'],
    'availability_status' => 'available'
];

$result = sendPropertyToMVA($propertyData, 'mva_your-api-key-here');

if ($result['success']) {
    echo "Proprietatea a fost trimisă cu succes!";
} else {
    echo "Eroare: " . $result['response']['error'];
}
?>
```

### 3. Exemplu JavaScript/Node.js

```javascript
const axios = require('axios');

async function sendPropertyToMVA(propertyData, apiKey) {
    try {
        // Asigură-te că sursa este setată pe "crm"
        propertyData.source = 'crm';
        
        const response = await axios.post(
            'https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/offers',
            propertyData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            }
        );
        
        return {
            success: true,
            data: response.data
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.message
        };
    }
}

// Exemplu de utilizare
const propertyData = {
    title: 'Vilă 4 camere Pipera',
    description: 'Vilă modernă cu grădină în zona de Nord',
    location: 'Pipera, București',
    price_min: 350000,
    rooms: 4,
    surface_min: 150,
    images: [
        'https://your-crm.com/images/villa/1.jpg',
        'https://your-crm.com/images/villa/2.jpg'
    ],
    features: ['Grădină', 'Garaj', 'Terasă'],
    availability_status: 'available',
    is_featured: true
};

sendPropertyToMVA(propertyData, 'mva_your-api-key-here')
    .then(result => {
        if (result.success) {
            console.log('Proprietatea a fost trimisă cu succes:', result.data);
        } else {
            console.error('Eroare:', result.error);
        }
    });
```

## Răspunsuri API

### Răspuns de Succes (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Apartament 2 camere Militari",
    "description": "...",
    "source": "crm",
    "created_at": "2025-01-09T10:30:00Z",
    "updated_at": "2025-01-09T10:30:00Z"
  },
  "timestamp": "2025-01-09T10:30:00Z"
}
```

### Răspuns de Eroare (400 Bad Request)
```json
{
  "success": false,
  "error": "Missing required fields: title, description",
  "timestamp": "2025-01-09T10:30:00Z"
}
```

### Răspuns de Eroare Autentificare (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid or missing API key",
  "timestamp": "2025-01-09T10:30:00Z"
}
```

## Vizualizarea Proprietăților

Proprietățile trimise din CRM cu `source: "crm"` vor apărea automat în:

1. **Tab "Proprietăți Noi"** - pe pagina de proprietăți din platforma web
2. **Tab "Toate"** - împreună cu proprietățile existente
3. **API Public** - disponibile pentru căutare și filtrare

## Obținerea API Key

1. Accesează pagina de administrare a platformei MVA
2. Navighează la secțiunea "API Keys"
3. Creează un API key nou cu denumirea pentru CRM-ul tău
4. Copiază API key-ul generat și folosește-l în integrare

## Rate Limiting și Limite

- **Limite de cereri:** 100 cereri/minut per API key
- **Dimensiune maximă payload:** 10MB
- **Imagini:** Se acceptă URL-uri externe la imagini (recomandat HTTPS)
- **Format imagini:** JPG, PNG, WebP

## Suport și Contact

Pentru întrebări sau probleme legate de integrare:
- **Email tehnic:** contact@mva-imobiliare.ro  
- **Telefon:** +40 XXX XXX XXX

## Changelog

- **v1.0** (Ian 2025) - Lansarea inițială a API-ului pentru integrarea CRM