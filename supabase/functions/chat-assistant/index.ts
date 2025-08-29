import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('OpenAI API key found:', openAIApiKey ? 'Yes' : 'No');

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

    // Fetch catalog offers for specific searches
    const { data: catalogOffers, error: catalogError } = await supabase
      .from('catalog_offers')
      .select('*')
      .eq('availability_status', 'available')
      .order('is_featured', { ascending: false });

    if (catalogError) {
      console.error('Error fetching catalog offers:', catalogError);
    }

    // Build comprehensive system prompt with catalog offers only
    let systemPrompt = `Ești un asistent AI pentru MVA Imobiliare, o agenție imobiliară specializată în proprietăți premium din vestul Bucureștiului. 

INFORMAȚII DESPRE COMPANIE:
- MVA Imobiliare - agenție specializată în proprietăți premium
- Locație: Vestul Bucureștiului (Chiajna)
- Specializare: Apartamente moderne cu finisaje premium

INFORMAȚII DE CONTACT:
- Telefon: 0767941512
- Email: mvaperfectbusiness@gmail.com

`;

    // Add catalog offers information only
    if (catalogOffers && catalogOffers.length > 0) {
      systemPrompt += "\nOFERTE DISPONIBILE:\n\n";
      
      catalogOffers.forEach((offer, index) => {
        systemPrompt += `${index + 1}. ${offer.title}:\n`;
        systemPrompt += `   - Descriere: ${offer.description}\n`;
        systemPrompt += `   - Preț: ${offer.price_min.toLocaleString()} EUR\n`;
        if (offer.surface_min && offer.surface_max) {
          systemPrompt += `   - Suprafață: ${offer.surface_min} - ${offer.surface_max} mp\n`;
        }
        systemPrompt += `   - Camere: ${offer.rooms}\n`;
        systemPrompt += `   - Locație: ${offer.location}\n`;
        if (offer.project_name) {
          systemPrompt += `   - Proiect: ${offer.project_name}\n`;
        }
        if (offer.features && offer.features.length > 0) {
          systemPrompt += `   - Caracteristici: ${offer.features.join(', ')}\n`;
        }
        if (offer.amenities && offer.amenities.length > 0) {
          systemPrompt += `   - Facilități: ${offer.amenities.join(', ')}\n`;
        }
        if (offer.is_featured) {
          systemPrompt += `   - Status: OFERTĂ PREMIUM\n`;
        }
        if (offer.storia_link) {
          systemPrompt += `   - Link Storia: ${offer.storia_link}\n`;
        }
        systemPrompt += "\n";
      });
    }

    systemPrompt += `
FUNCȚIONALITĂȚI SPECIALE:
- PRIORITATE: Când clienții specifică un buget, folosește ÎNTOTDEAUNA ofertele din CATALOG pentru a recomanda apartamentele potrivite
- Când clienții cer "oferte" sau "apartamente", prezintă PRIMUL ofertele din catalog cu prețuri exacte
- Când clienții specifică un buget (ex: "apartament până în 100.000 EUR"), caută în ofertele din catalog și recomandă apartamentele care se încadrează în buget
- Când cer un anumit număr de camere (ex: "apartament cu 2 camere"), filtrează ofertele corespunzătoare din catalog
- Când au cerințe speciale (ex: "cu terasă", "cu parcare"), caută în caracteristicile și facilitățile ofertelor din catalog
- Prezintă detaliile complete ale ofertelor din catalog, inclusiv prețul exact și caracteristicile
- Ofertele din catalog au prețuri exacte și sunt disponibile pentru vânzare imediată

ROLUL TĂU:
- Răspunde în română, într-un ton profesional dar prietenos
- Când clienții cer oferte sau specifică un buget/cerințe, prezintă ÎNTOTDEAUNA PRIMUL ofertele din CATALOG cu prețuri exacte
- Pentru fiecare ofertă prezentată, include linkul către Storia DOAR dacă există (storia_link nu este null)
- Când oferta are link Storia, prezintă-l astfel: "Detalii complete: [linkul Storia]" 
- Când oferta nu are link Storia, menționează: "Pentru detalii și poze, contactează-ne direct"
- Folosește ofertele din catalog pentru a răspunde la întrebări despre prețuri și disponibilitate
- Ofertele din catalog sunt prioritare și singurele oferte pe care le prezinți
- Ajută clienții să găsească proprietatea potrivită pe baza bugetului și cerințelor lor
- Colectează informațiile de contact (nume, telefon, email)
- Programează vizite pentru proprietăți
- Răspunde la întrebări despre investiții imobiliare
- Explică avantajele fiecărui proiect
- Când oferi informații de contact, folosește: Telefon 0767941512 și Email mvaperfectbusiness@gmail.com

IMPORTANT: 
- Folosește DOAR ofertele din catalog - nu mai menciona proiectele rezidențiale generale
- Nu mai oferi linkul către catalogul WhatsApp 
- Când clienții cer "oferte", "catalog" sau specifică criterii (buget, camere), caută în ofertele din catalog și prezintă opțiunile potrivite
- Nu inventa informații care nu sunt furnizate
- Dacă nu știi ceva, spune că vei verifica cu echipa și îi vei reveni cu detalii`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', catalogOffers?.length || 0, 'catalog offers loaded');
    
    if (catalogOffers && catalogOffers.length > 0) {
      console.log('Catalog offers loaded:', catalogOffers.map(offer => `${offer.title} - ${offer.price_min} EUR`));
    } else {
      console.log('No catalog offers found!');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

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

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      message: 'Ne pare rău, a apărut o problemă. Te rugăm să încerci din nou sau să ne contactezi direct.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});