import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("Resend API Key exists:", !!resendApiKey);
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    const resend = new Resend(resendApiKey);
    
    
    const requestBody = await req.text();
    console.log("Request body:", requestBody);
    
    const { nume, prenume, email, telefon, mesaj }: ContactFormData = JSON.parse(requestBody);
    console.log("Parsed form data:", { nume, prenume, email, telefon });

    console.log("Sending contact email from:", email);

    const emailResponse = await resend.emails.send({
      from: "MVA IMOBILIARE <noreply@mvaimobiliare.ro>",
      to: ["mvaperfectbusiness@gmail.com"],
      subject: "Cerere de contact - MVA IMOBILIARE",
      html: `
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
    });

    console.log("Email sent successfully via Resend:", emailResponse);
    
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