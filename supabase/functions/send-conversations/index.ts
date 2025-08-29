import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    const { email, startDate, endDate } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Get conversations from database
    const { data: conversations, error: conversationsError } = await supabase
      .rpc('get_conversations_summary', {
        start_date: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0]
      });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      throw new Error('Failed to fetch conversations');
    }

    // Format conversations for email
    let emailContent = `
    <h2>Raport Conversații MVA Imobiliare</h2>
    <p><strong>Perioada:</strong> ${startDate || 'Ultima săptămână'} - ${endDate || 'Azi'}</p>
    <p><strong>Total conversații:</strong> ${conversations?.length || 0}</p>
    <hr>
    `;

    if (conversations && conversations.length > 0) {
      for (const conv of conversations) {
        // Get full conversation details
        const { data: messages, error: messagesError } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('session_id', conv.session_id)
          .order('timestamp', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          continue;
        }

        emailContent += `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>Conversația din ${new Date(conv.conversation_start).toLocaleString('ro-RO')}</h3>
          <p><strong>Total mesaje:</strong> ${conv.message_count}</p>
          <p><strong>Primul mesaj:</strong> "${conv.first_user_message}"</p>
          
          <h4>Conversația completă:</h4>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
        `;

        if (messages) {
          messages.forEach((msg) => {
            const isUser = msg.role === 'user';
            emailContent += `
            <div style="margin-bottom: 15px; padding: 10px; background: ${isUser ? '#e3f2fd' : '#f3e5f5'}; border-radius: 5px;">
              <strong>${isUser ? '👤 Client' : '🤖 Asistent'}:</strong> ${msg.message}
              <br><small style="color: #666;">${new Date(msg.timestamp).toLocaleString('ro-RO')}</small>
            </div>
            `;
          });
        }

        emailContent += `
          </div>
        </div>
        `;
      }
    } else {
      emailContent += '<p>Nu au fost găsite conversații în perioada selectată.</p>';
    }

    // Send email using Resend (you'll need to add RESEND_API_KEY secret)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MVA Imobiliare <noreply@mvaimobiliare.com>',
        to: [email],
        subject: `Raport Conversații MVA Imobiliare - ${new Date().toLocaleDateString('ro-RO')}`,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error('Failed to send email');
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Conversațiile au fost trimise cu succes!',
      conversations_count: conversations?.length || 0,
      email_id: emailResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-conversations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});