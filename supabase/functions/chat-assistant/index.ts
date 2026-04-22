import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], sessionId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || crypto.randomUUID();

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!deepseekApiKey) {
      console.error('DEEPSEEK_API_KEY environment variable is not set');
      throw new Error('DeepSeek API key not configured');
    }
    
    console.log('DeepSeek API key found:', deepseekApiKey ? 'Yes' : 'No');
    console.log('Perplexity API key found:', perplexityApiKey ? 'Yes' : 'No');

    // Save user message to database
    const { error: saveUserError } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: currentSessionId,
        message: message,
        role: 'user'
      });

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError);
    }

    // Smart filtering based on user message
    const lowerMessage = message.toLowerCase();
    let catalogQuery = supabase
      .from('catalog_offers')
      .select('*')
      .eq('availability_status', 'available')
      .order('is_featured', { ascending: false });

    // Filter by number of rooms
    if (lowerMessage.includes('garsoniera') || lowerMessage.includes('studio')) {
      catalogQuery = catalogQuery.eq('rooms', 1);
      console.log('Filtering: garsoniera (1 room)');
    } else if (lowerMessage.match(/\b1\s*cam/i)) {
      catalogQuery = catalogQuery.eq('rooms', 1);
      console.log('Filtering: 1 camera');
    } else if (lowerMessage.match(/\b2\s*cam/i)) {
      catalogQuery = catalogQuery.eq('rooms', 2);
      console.log('Filtering: 2 camere');
    } else if (lowerMessage.match(/\b3\s*cam/i)) {
      catalogQuery = catalogQuery.eq('rooms', 3);
      console.log('Filtering: 3 camere');
    } else if (lowerMessage.match(/\b4\s*cam/i)) {
      catalogQuery = catalogQuery.eq('rooms', 4);
      console.log('Filtering: 4 camere');
    }

    // Filter by price (budget)
    const priceMatch = lowerMessage.match(/(\d+)[.,]?(\d+)?\s*(?:k|mii|euro|eur|€)/i);
    if (priceMatch) {
      let maxPrice = parseInt(priceMatch[1]);
      if (priceMatch[2]) maxPrice = parseInt(priceMatch[1] + priceMatch[2]);
      if (lowerMessage.includes('k') || lowerMessage.includes('mii')) maxPrice *= 1000;
      
      if (lowerMessage.includes('pana') || lowerMessage.includes('până') || 
          lowerMessage.includes('sub') || lowerMessage.includes('max')) {
        catalogQuery = catalogQuery.lte('price_min', maxPrice);
        console.log(`Filtering: price <= ${maxPrice}`);
      }
    }

    // Filter by location
    if (lowerMessage.includes('chiajna')) {
      catalogQuery = catalogQuery.ilike('location', '%chiajna%');
      console.log('Filtering: location Chiajna');
    } else if (lowerMessage.includes('militari')) {
      catalogQuery = catalogQuery.ilike('location', '%militari%');
      console.log('Filtering: location Militari');
    } else if (lowerMessage.includes('bucuresti') || lowerMessage.includes('bucurești')) {
      catalogQuery = catalogQuery.ilike('location', '%bucuresti%');
      console.log('Filtering: location București');
    }

    // Execute the filtered query - LIMIT TO 50 MAX
    catalogQuery = catalogQuery.limit(50);
    
    const { data: catalogOffers, error: catalogError } = await catalogQuery;

    if (catalogError) {
      console.error('Error fetching catalog offers:', catalogError);
    }

    // Search online for MVA Imobiliare offers when user asks about offers
    let webSearchResults = '';
    const lowerMessage = message.toLowerCase();
    const searchTriggers = ['ofert', 'apartament', 'proprietat', 'casa', 'teren', 'imobil', 'vanz', 'cumpăr', 'închiri', 'buget', 'preț', 'caută', 'găsește', 'disponibil', 'camere'];
    
    if (perplexityApiKey && searchTriggers.some(trigger => lowerMessage.includes(trigger))) {
      console.log('Triggering web search for real estate related query:', message);
      try {
        const searchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
              {
                role: 'system',
                content: 'Ești un expert în căutarea ofertelor imobiliare. Caută DOAR pe mvaimobiliare.ro oferte de proprietăți. Returnează linkurile complete, prețurile exacte și descrierile scurte pentru fiecare ofertă găsită. Fii foarte specific cu linkurile exacte și nu inventa informații.'
              },
              {
                role: 'user',
                content: `Caută pe mvaimobiliare.ro oferte imobiliare. Pentru mesajul: "${message}" - găsește ofertele corespunzătoare și returnează linkurile exacte cu prețurile și descrierile.`
              }
            ],
            temperature: 0.1,
            max_tokens: 1000,
            search_domain_filter: ['mvaimobiliare.ro'],
            search_recency_filter: 'month',
            return_related_questions: false
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          webSearchResults = searchData.choices[0].message.content || '';
          console.log('Web search completed successfully, results:', webSearchResults.length > 0 ? 'Found results' : 'No results');
        } else {
          const errorText = await searchResponse.text();
          console.error('Error in web search, status:', searchResponse.status, 'error:', errorText);
        }
      } catch (error) {
        console.error('Error performing web search:', error);
      }
    } else {
      console.log('Web search skipped - no API key or no trigger words found');
    }

    // Build comprehensive system prompt with catalog offers and web results
    let systemPrompt = `Ești Sofia, asistentul AI pentru MVA Imobiliare, o agenție imobiliară specializată în proprietăți premium din vestul Bucureștiului.

INFORMAȚII DESPRE COMPANIE:
- MVA Imobiliare - agenție specializată în proprietăți premium
- Locație: Vestul Bucureștiului (Chiajna)
- Specializare: Apartamente moderne cu finisaje premium
- Website: https://mvaimobiliare.ro

PAGINI IMPORTANTE:
- Pagina principală: https://mvaimobiliare.ro/
- Toate proprietățile: https://mvaimobiliare.ro/proprietati
- De ce să ne alegi: https://mvaimobiliare.ro/de-ce-sa-ne-alegi

INFORMAȚII DE CONTACT:
- Telefon: 0767941512
- Email: mvaperfectbusiness@gmail.com

`;

    // Add catalog offers information with DIRECT LINKS
    if (catalogOffers && catalogOffers.length > 0) {
      systemPrompt += `OFERTE RELEVANTE GĂSITE (${catalogOffers.length} proprietăți selectate pentru cererea ta):\n\n`;
      
      catalogOffers.forEach((offer, index) => {
        const propertyLink = `https://mvaimobiliare.ro/proprietati/${offer.id}`;
        systemPrompt += `${index + 1}. ${offer.title}\n`;
        systemPrompt += `   📍 ${offer.location}\n`;
        systemPrompt += `   💰 ${offer.price_min.toLocaleString()} ${offer.currency || 'EUR'}\n`;
        if (offer.surface_min) {
          systemPrompt += `   📐 ${offer.surface_min}${offer.surface_max && offer.surface_max !== offer.surface_min ? `-${offer.surface_max}` : ''} mp\n`;
        }
        systemPrompt += `   🏠 ${offer.rooms} camere\n`;
        if (offer.description) {
          systemPrompt += `   📝 ${offer.description.substring(0, 100)}...\n`;
        }
        if (offer.features && offer.features.length > 0) {
          systemPrompt += `   ✨ ${offer.features.slice(0, 3).join(', ')}\n`;
        }
        systemPrompt += `   🔗 LINK: ${propertyLink}\n\n`;
      });
      
      systemPrompt += "\nNOTĂ: Pentru mai multe opțiuni sau alte criterii, îndrumă utilizatorii la https://mvaimobiliare.ro/proprietati unde pot filtra toate cele 580+ oferte.\n";
      systemPrompt += "IMPORTANT: Nu menționa numele proiectelor rezidențiale. Focusează-te pe caracteristici, locație, preț.\n\n";
    } else {
      systemPrompt += "\nNu am găsit oferte care să corespundă exact criteriilor. Recomandă utilizatorului să viziteze https://mvaimobiliare.ro/proprietati pentru a vedea toate opțiunile sau să îți spună alte preferințe.\n\n";
    }

    // Add web search results if available
    if (webSearchResults) {
      systemPrompt += "\nRESULTATE CĂUTARE WEB (mvaimobiliare.ro):\n\n";
      systemPrompt += webSearchResults + "\n\n";
    }

    systemPrompt += `
FUNCȚIONALITĂȚI SPECIALE:
- PRIORITATE MAXIMĂ: Pentru orice cerere de oferte, prezintă ofertele din catalogul nostru cu LINKURI DIRECTE
- Pentru fiecare ofertă, include linkul direct: "🔗 Vezi detalii complete: https://mvaimobiliare.ro/proprietati/ID"
- Completează cu rezultatele căutării web când sunt disponibile
- Când prezinți oferte, ÎNTOTDEAUNA include linkul direct către pagina proprietății
- Dacă nu găsești rezultate web, folosește catalogul local și oferă linkuri directe

STRUCTURA SITE-ULUI:
- Pagina principală: informații generale, servicii, contact
- Pagina proprietăți: toate ofertele disponibile cu filtre
- Fiecare proprietate: pagină dedicată cu detalii complete, galerie foto, formular contact
- De ce să ne alegi: avantajele agenției, testimoniale, cifre

ROLUL TĂU:
- Răspunde în română, într-un ton profesional dar prietenos
- PRIORITATE MAXIMĂ: Pentru cereri de oferte, prezintă ofertele cu LINKURI DIRECTE
- Pentru fiecare proprietate, include linkul: "🔗 Vezi detalii complete: https://mvaimobiliare.ro/proprietati/ID-UL_PROPRIETATII"
- NU MENȚIONA numele proiectelor rezidențiale (ex: Militari Residence, Renew Residence, etc.)
- Focusează-te pe: caracteristici, locație, preț, beneficii, facilități
- Ajută clienții să găsească proprietatea potrivită pe baza bugetului și cerințelor lor
- Colectează informațiile de contact (nume, telefon, email)
- Programează vizite pentru proprietăți
- Răspunde la întrebări despre investiții imobiliare
- Explică avantajele fiecărei proprietăți și zonei
- Când oferi informații de contact, folosește: Telefon 0767941512 și Email mvaperfectbusiness@gmail.com

IMPORTANT: 
- ÎNTOTDEAUNA include linkul DIRECT către fiecare proprietate când o prezinți
- Format link: https://mvaimobiliare.ro/proprietati/[ID-ul proprietății]
- Nu trimite utilizatorii la pagina generală /proprietati, ci la pagina specifică proprietății
- Folosește rezultatele căutării web pentru a completa informațiile
- Pentru ofertele din catalog, OBLIGATORIU: linkul direct către pagina proprietății
- Nu inventa linkuri sau informații care nu sunt furnizate
- Dacă nu găsești oferte specifice, recomandă să viziteze https://mvaimobiliare.ro/proprietati sau să contacteze direct agenția`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to DeepSeek with', catalogOffers?.length || 0, 'catalog offers loaded');
    console.log('Web search results available:', webSearchResults ? 'Yes' : 'No');
    
    if (catalogOffers && catalogOffers.length > 0) {
      console.log('Catalog offers loaded:', catalogOffers.map(offer => `${offer.title} - ${offer.price_min} EUR`));
    } else {
      console.log('No catalog offers found!');
    }
    
    if (webSearchResults) {
      console.log('Web search results preview:', webSearchResults.substring(0, 200) + '...');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DeepSeek response received');

    const assistantMessage = data.choices[0].message.content;

    // Save assistant message to database
    const { error: saveAssistantError } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: currentSessionId,
        message: assistantMessage,
        role: 'assistant'
      });

    if (saveAssistantError) {
      console.error('Error saving assistant message:', saveAssistantError);
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      sessionId: currentSessionId,
      conversationHistory: [...conversationHistory, 
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in chat-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Internal server error',
      message: 'Ne pare rău, a apărut o problemă. Te rugăm să încerci din nou sau să ne contactezi direct.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});