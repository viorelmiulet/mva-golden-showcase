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
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('OpenAI API key found:', openAIApiKey ? 'Yes' : 'No');
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

    // Fetch catalog offers for specific searches
    const { data: catalogOffers, error: catalogError } = await supabase
      .from('catalog_offers')
      .select('*')
      .eq('availability_status', 'available')
      .order('is_featured', { ascending: false });

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
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'Ești un expert în căutarea ofertelor imobiliare. Caută DOAR pe storia.ro oferte de la agenția "MVA Imobiliare" sau "MVA Perfect Business". Returnează linkurile complete Storia.ro, prețurile exacte și descrierile scurte pentru fiecare ofertă găsită. Fii foarte specific cu linkurile exacte și nu inventa informații.'
              },
              {
                role: 'user',
                content: `Caută pe storia.ro oferte imobiliare DOAR de la MVA Imobiliare sau MVA Perfect Business. Pentru mesajul: "${message}" - găsește ofertele corespunzătoare și returnează linkurile exacte Storia.ro cu prețurile și descrierile.`
              }
            ],
            temperature: 0.1,
            max_tokens: 1000,
            search_domain_filter: ['storia.ro'],
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

    // Local projects from the website
    const localProjects = [
      {
        title: "RENEW RESIDENCE",
        location: "Chiajna", 
        price: "€44,000 - €90,000",
        size: "32 - 65 mp",
        rooms: "1-2 camere",
        description: "Proiect modern cu finisaje premium și facilități contemporane în vestul capitalei.",
        features: ["Finisaje Premium", "Spații Verzi"],
        link: "https://renewresidence.ro/",
        websiteLink: "https://mvaimobiliare.ro/#proprietati"
      },
      {
        title: "EUROCASA RESIDENCE",
        location: "Chiajna",
        price: "€40,000 - €102,000", 
        size: "30 - 75 mp",
        rooms: "1-3 camere",
        description: "Proiect imobiliar de excepție, situat în vestul capitalei.",
        features: ["Design Modern", "Sistem Securitate", "Zonă Comercială"],
        websiteLink: "https://mvaimobiliare.ro/#proprietati"
      },
      {
        title: "CITY MILITARI",
        location: "Militari",
        price: "€45,000 - €100,000",
        size: "32 - 55 mp", 
        rooms: "1-2 camere",
        description: "Complex rezidențial modern în zona Militari, cu apartamente compacte și funcționale.",
        features: ["Locuințe Moderne", "Acces Rapid", "Parcare"],
        websiteLink: "https://mvaimobiliare.ro/#proprietati"
      }
    ];

    // Build comprehensive system prompt with catalog offers and web results
    let systemPrompt = `Ești Sofia, asistentul AI pentru MVA Imobiliare, o agenție imobiliară specializată în proprietăți premium din vestul Bucureștiului.

INFORMAȚII DESPRE COMPANIE:
- MVA Imobiliare - agenție specializată în proprietăți premium
- Locație: Vestul Bucureștiului (Chiajna)
- Specializare: Apartamente moderne cu finisaje premium

INFORMAȚII DE CONTACT:
- Telefon: 0767941512
- Email: mvaperfectbusiness@gmail.com

PROIECTE PRINCIPALE (pe site-ul nostru):
`;

    // Add local projects information
    localProjects.forEach((project, index) => {
      systemPrompt += `${index + 1}. ${project.title}\n`;
      systemPrompt += `   📍 ${project.location}\n`;
      systemPrompt += `   💰 ${project.price}\n`;
      systemPrompt += `   📐 ${project.size}\n`;
      systemPrompt += `   🏠 ${project.rooms}\n`;
      systemPrompt += `   📝 ${project.description}\n`;
      systemPrompt += `   ✨ ${project.features.join(', ')}\n`;
      if (project.link) {
        systemPrompt += `   🔗 Link dedicat: ${project.link}\n`;
      }
      systemPrompt += `   🔗 Vezi pe site: ${project.websiteLink}\n\n`;
    });

    systemPrompt += `
`;

    // Add catalog offers information only
    if (catalogOffers && catalogOffers.length > 0) {
      systemPrompt += "\nOFERTE DISPONIBILE:\n\n";
      
      catalogOffers.forEach((offer, index) => {
        systemPrompt += `${index + 1}. ${offer.title} - ${offer.price_min.toLocaleString()} EUR\n`;
        if (offer.storia_link) {
          systemPrompt += `   Link: ${offer.storia_link}\n`;
        }
        systemPrompt += "\n";
      });
    }

    // Add web search results if available
    if (webSearchResults) {
      systemPrompt += "\nRESULTATE CĂUTARE WEB (Storia.ro și alte surse):\n\n";
      systemPrompt += webSearchResults + "\n\n";
    }

    systemPrompt += `
FUNCȚIONALITĂȚI SPECIALE:
- PRIORITATE MAXIMĂ: Pentru orice cerere de oferte, execută ÎNTOTDEAUNA căutarea web pe Storia.ro pentru cele mai recente oferte MVA
- Folosește PRIMUL rezultatele căutării web de pe Storia.ro cu linkurile complete și exacte
- Completează cu ofertele din catalogul local doar dacă căutarea web nu găsește suficiente rezultate
- Pentru fiecare ofertă din căutarea web, INCLUDE linkul complet și exact către Storia.ro
- Prezintă linkurile Storia.ro în formatul: "🔗 Vezi detalii complete: [link Storia.ro]"
- Când ai rezultate web, menționează că sunt "cele mai recente oferte de pe Storia.ro"
- Dacă nu găsești rezultate web, folosește catalogul local și menționează că îi recomandi să contacteze direct agenția pentru ofertele cele mai noi

ROLUL TĂU:
- Răspunde în română, într-un ton profesional dar prietenos
- PRIORITATE MAXIMĂ: Pentru cereri de oferte, prezintă PRIMUL proiectele principale de pe site-ul nostru cu linkurile complete
- Pentru căutările web suplimentare pe Storia.ro, prezintă rezultatele cu linkurile complete și exacte
- Pentru proiectele principale (RENEW RESIDENCE, EUROCASA RESIDENCE, CITY MILITARI), folosește linkurile de pe site-ul nostru
- Pentru RENEW RESIDENCE, menționează linkul dedicat: https://renewresidence.ro/
- Pentru toate proiectele, include linkul: "🔗 Vezi pe site: https://mvaimobiliare.ro/#proprietati"
- Completează cu ofertele din catalogul din baza de date și căutările web dacă este necesar
- Combină informațiile din toate sursele pentru a oferi cea mai completă listă de opțiuni
- Ajută clienții să găsească proprietatea potrivită pe baza bugetului și cerințelor lor
- Colectează informațiile de contact (nume, telefon, email)
- Programează vizite pentru proprietăți
- Răspunde la întrebări despre investiții imobiliare
- Explică avantajele fiecărui proiect
- Când oferi informații de contact, folosește: Telefon 0767941512 și Email mvaperfectbusiness@gmail.com

IMPORTANT: 
- ÎNTOTDEAUNA prezintă PRIMUL proiectele principale de pe site-ul nostru când sunt solicitate oferte
- Pentru RENEW RESIDENCE, include linkul dedicat: https://renewresidence.ro/
- Pentru toate proiectele principale, include: "🔗 Vezi pe site: https://mvaimobiliare.ro/#proprietati"
- Folosește apoi rezultatele căutării web de pe Storia.ro când sunt disponibile
- Combină rezultatele web cu ofertele din catalog pentru o imagine completă
- ÎNTOTDEAUNA include linkurile complete către Storia.ro pentru ofertele găsite online
- Când prezinți oferte web, menționează că sunt cele mai recente de pe Storia.ro
- Pentru ofertele din catalogul local fără linkuri web, menționează: "Pentru detalii și poze, contactează-ne direct"
- Nu inventa linkuri sau informații care nu sunt furnizate
- Dacă nu găsești oferte web și nu ai în catalog, recomandă să contacteze direct agenția`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', catalogOffers?.length || 0, 'catalog offers loaded');
    console.log('Web search results available:', webSearchResults ? 'Yes' : 'No');
    
    if (catalogOffers && catalogOffers.length > 0) {
      console.log('Catalog offers loaded:', catalogOffers.map(offer => `${offer.title} - ${offer.price_min} EUR`));
    } else {
      console.log('No catalog offers found!');
    }
    
    if (webSearchResults) {
      console.log('Web search results preview:', webSearchResults.substring(0, 200) + '...');
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