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

    // Fetch all real estate projects from database
    const { data: projects, error: projectsError } = await supabase
      .from('real_estate_projects')
      .select('*')
      .eq('status', 'available')
      .order('is_recommended', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Build comprehensive system prompt with database information
    let systemPrompt = `Ești un asistent AI pentru MVA Imobiliare, o agenție imobiliară specializată în proprietăți premium din vestul Bucureștiului. 

INFORMAȚII DESPRE COMPANIE:
- MVA Imobiliare - agenție specializată în proprietăți premium
- Locație: Vestul Bucureștiului (Chiajna)
- Specializare: Apartamente moderne cu finisaje premium

INFORMAȚII DE CONTACT:
- Telefon: 0767941512
- Email: mvaperfectbusiness@gmail.com

`;

    // Add project information from database
    if (projects && projects.length > 0) {
      systemPrompt += "PROIECTELE DISPONIBILE:\n\n";
      
      projects.forEach((project, index) => {
        systemPrompt += `${index + 1}. ${project.name} (${project.location}):\n`;
        systemPrompt += `   - Dezvoltator: ${project.developer || 'N/A'}\n`;
        systemPrompt += `   - Preț: ${project.price_range}\n`;
        systemPrompt += `   - Suprafață: ${project.surface_range}\n`;
        systemPrompt += `   - Camere: ${project.rooms_range}\n`;
        systemPrompt += `   - Descriere: ${project.description}\n`;
        
        if (project.features && project.features.length > 0) {
          systemPrompt += `   - Caracteristici: ${project.features.join(', ')}\n`;
        }
        
        if (project.amenities && project.amenities.length > 0) {
          systemPrompt += `   - Facilități: ${project.amenities.join(', ')}\n`;
        }
        
        if (project.location_advantages && project.location_advantages.length > 0) {
          systemPrompt += `   - Avantaje locație: ${project.location_advantages.join(', ')}\n`;
        }
        
        if (project.payment_plans && project.payment_plans.length > 0) {
          systemPrompt += `   - Planuri de plată: ${project.payment_plans.join(', ')}\n`;
        }
        
        if (project.investment_details) {
          systemPrompt += `   - Detalii investiție: ${project.investment_details}\n`;
        }
        
        if (project.completion_date) {
          systemPrompt += `   - Data finalizării: ${project.completion_date}\n`;
        }
        
        if (project.total_units) {
          systemPrompt += `   - Blocul va avea: ${project.total_units} apartamente\n`;
        }
        
        // Add detailed info if available
        if (project.detailed_info) {
          const details = project.detailed_info;
          if (details.nearby_schools) {
            systemPrompt += `   - Școli în apropiere: ${details.nearby_schools.join(', ')}\n`;
          }
          if (details.nearby_shopping) {
            systemPrompt += `   - Shopping: ${details.nearby_shopping.join(', ')}\n`;
          }
          if (details.public_transport) {
            systemPrompt += `   - Transport public: ${details.public_transport.join(', ')}\n`;
          }
          if (details.medical_facilities) {
            systemPrompt += `   - Facilități medicale: ${details.medical_facilities.join(', ')}\n`;
          }
          if (details.completion_stages) {
            systemPrompt += `   - Stadiu construcție: ${details.completion_stages.join(', ')}\n`;
          }
          if (details.energy_class) {
            systemPrompt += `   - Clasă energetică: ${details.energy_class}\n`;
          }
          if (details.building_height) {
            systemPrompt += `   - Înălțime clădire: ${details.building_height}\n`;
          }
          if (details.parking_spaces) {
            systemPrompt += `   - Locuri de parcare: ${details.parking_spaces}\n`;
          }
          if (details.green_spaces_percent) {
            systemPrompt += `   - Spații verzi: ${details.green_spaces_percent}%\n`;
          }
        }
        
        if (project.website_url) {
          systemPrompt += `   - Link detalii complete: ${project.website_url}\n`;
        }
        
        if (project.is_recommended) {
          systemPrompt += `   - Status: RECOMANDAT\n`;
        }
        
        systemPrompt += "\n";
      });
    }

    systemPrompt += `
ROLUL TĂU:
- Răspunde în română, într-un ton profesional dar prietenos
- Ajută clienții să găsească proprietatea potrivită
- Oferă informații despre proiecte, prețuri, facilități
- Când clienții cer oferte sau link-uri, oferă linkurile disponibile pentru proiecte
- Pentru RENEW RESIDENCE, linkul este: https://renewresidence.ro/
- Colectează informațiile de contact (nume, telefon, email)
- Programează vizite pentru proprietăți
- Răspunde la întrebări despre investiții imobiliare
- Explică avantajele fiecărui proiect
- Când oferi informații de contact, folosește: Telefon 0767941512 și Email mvaperfectbusiness@gmail.com

LINKURI SPECIALE:
- Pentru RENEW RESIDENCE: https://renewresidence.ro/ (oferă acest link când clienții întreabă despre RENEW RESIDENCE sau cer link-uri cu oferte)

IMPORTANT: 
- Folosește DOAR informațiile din baza de date de mai sus
- Când clienții cer "link-uri cu oferte" sau "oferte online", oferă linkurile disponibile pentru proiectele relevante
- Nu inventa informații care nu sunt furnizate
- Dacă nu știi ceva, spune că vei verifica cu echipa și îi vei reveni cu detalii
- Poți folosi informațiile detaliate despre proiecte pentru a răspunde la întrebări specifice`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', projects?.length || 0, 'projects loaded');

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