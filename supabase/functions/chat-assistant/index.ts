import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('OpenAI API key found:', openAIApiKey ? 'Yes' : 'No');

    // System prompt for real estate assistant
    const systemPrompt = `Ești un asistent AI pentru MVA Imobiliare, o agenție imobiliară specializată în complexe rezidențiale premium din vestul Bucureștiului. 

INFORMAȚII DESPRE COMPANIE:
- MVA Imobiliare - agenție specializată în proprietăți premium
- Locație: Vestul Bucureștiului (Chiajna)
- Specializare: Complexe rezidențiale moderne cu finisaje premium

INFORMAȚII DE CONTACT:
- Telefon: 0767941512
- Email: mvaperfectbusiness@gmail.com

PROIECTELE PRINCIPALE:
1. RENEW RESIDENCE (Chiajna):
   - Preț: €44,000 - €90,000
   - Suprafață: 32-65 mp
   - Camere: 1-2 camere
   - Caracteristici: Finisaje Premium, Spații Verzi
   - Status: RECOMANDAT

2. EUROCASA RESIDENCE (Chiajna):
   - Preț: €40,000 - €102,000
   - Suprafață: 30-75 mp
   - Camere: 1-3 camere
   - Caracteristici: Design Modern, Sistem Securitate, Zonă Comercială

ROLUL TĂU:
- Răspunde în română, într-un ton profesional dar prietenos
- Ajută clienții să găsească proprietatea potrivită
- Oferă informații despre proiecte, prețuri, facilități
- Colectează informațiile de contact (nume, telefon, email)
- Programează vizite pentru proprietăți
- Răspunde la întrebări despre investiții imobiliare
- Explică avantajele fiecărui proiect
- Când oferi informații de contact, folosește: Telefon 0767941512 și Email mvaperfectbusiness@gmail.com

Nu inventa informații care nu sunt furnizate. Dacă nu știi ceva, spune că vei verifica cu echipa și îi vei reveni cu detalii.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with messages:', messages.length);

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

    return new Response(JSON.stringify({ 
      message: assistantMessage,
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