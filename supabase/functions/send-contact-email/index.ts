import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getFromAddressForFunction } from '../_shared/emailSettings.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  nume: string;
  prenume: string;
  email: string;
  telefon: string;
  mesaj: string;
}

const sendMailgunEmail = async (
  to: string[],
  subject: string,
  html: string,
  from: string
) => {
  const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
  const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error("Mailgun credentials not configured");
  }

  const formData = new FormData();
  formData.append("from", from);
  to.forEach((recipient) => formData.append("to", recipient));
  formData.append("subject", subject);
  formData.append("html", html);

  const response = await fetch(
    `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mailgun error:", errorText);
    throw new Error(`Mailgun API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== EDGE FUNCTION CALLED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing POST request...");
    
    const requestBody = await req.text();
    
    const raw = JSON.parse(requestBody);

    // Server-side validation
    const nume = String(raw.nume ?? '').trim().slice(0, 100);
    const prenume = String(raw.prenume ?? '').trim().slice(0, 100);
    const email = String(raw.email ?? '').trim().slice(0, 255);
    const telefon = String(raw.telefon ?? '').trim().slice(0, 20);
    const mesaj = String(raw.mesaj ?? '').trim().slice(0, 2000);

    if (!nume || !prenume || !mesaj) {
      return new Response(JSON.stringify({ success: false, error: 'Câmpuri obligatorii lipsesc.' }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Adresă de email invalidă.' }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!/^\+?[0-9\s]{7,20}$/.test(telefon)) {
      return new Response(JSON.stringify({ success: false, error: 'Număr de telefon invalid.' }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // HTML escape helper
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

    const safeNume = esc(nume);
    const safePrenume = esc(prenume);
    const safeEmail = esc(email);
    const safeTelefon = esc(telefon);
    const safeMesaj = esc(mesaj);

    console.log("Validated form data:", { nume, prenume, email: safeEmail, telefon });

    // Get email sender settings from database
    const fromAddress = await getFromAddressForFunction('contact');
    console.log("Using from address:", fromAddress);

    console.log("Sending contact email from:", email);

    const emailResponse = await sendMailgunEmail(
      ["mvaperfectbusiness@gmail.com"],
      "Cerere de contact - MVA IMOBILIARE",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DAA520;">Cerere de contact nouă</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Informații contact:</h3>
            
            <p><strong>Nume:</strong> ${nume}</p>
            <p><strong>Prenume:</strong> ${prenume}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Telefon:</strong> <a href="tel:${telefon}">${telefon}</a></p>
            
            <h3 style="color: #333; margin-top: 30px;">Mesaj:</h3>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #DAA520; margin-top: 10px;">
              ${mesaj.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis prin formularul de contact de pe website-ul MVA IMOBILIARE.
          </p>
        </div>
      `,
      fromAddress
    );

    console.log("Email sent successfully via Mailgun:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email trimis cu succes!" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Eroare la trimiterea email-ului. Vă rugăm încercați din nou." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
