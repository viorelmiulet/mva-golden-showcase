import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CollaborationFormData {
  nume: string;
  prenume: string;
  email: string;
  telefon: string;
  tipProprietate: string;
  tipTranzactie: string;
  adresa: string;
  pret: string;
  suprafata: string;
  descriere: string;
  images: Array<{
    name: string;
    size: number;
    type: string;
    data: string; // base64
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== COLLABORATION EMAIL FUNCTION CALLED ===");
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
    console.log("Request body received, length:", requestBody.length);
    
    const formData: CollaborationFormData = JSON.parse(requestBody);
    console.log("Parsed form data:", { 
      nume: formData.nume, 
      prenume: formData.prenume, 
      email: formData.email, 
      telefon: formData.telefon,
      tipProprietate: formData.tipProprietate,
      adresa: formData.adresa,
      imagesCount: formData.images?.length || 0
    });

    // Prepare attachments from base64 images for Resend
    const attachments = formData.images?.map(image => ({
      content: image.data.split(',')[1], // Remove data:image/jpeg;base64, prefix
      filename: image.name,
    })) || [];

    console.log("Sending collaboration email with", attachments.length, "attachments");

    const emailResponse = await resend.emails.send({
      from: "MVA IMOBILIARE <noreply@mvaimobiliare.ro>",
      to: ["mvaperfectbusiness@gmail.com"],
      subject: `Propunere Colaborare - ${formData.tipProprietate} pentru ${formData.tipTranzactie} în ${formData.adresa}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DAA520;">Propunere de Colaborare Nouă</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Informații Contact:</h3>
            
            <p><strong>Nume:</strong> ${formData.nume} ${formData.prenume}</p>
            <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
            <p><strong>Telefon:</strong> <a href="tel:${formData.telefon}">${formData.telefon}</a></p>
          </div>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalii Proprietate:</h3>
            
            <p><strong>Tip proprietate:</strong> ${formData.tipProprietate}</p>
            <p><strong>Tip tranzacție:</strong> ${formData.tipTranzactie}</p>
            <p><strong>Adresa:</strong> ${formData.adresa}</p>
            <p><strong>Preț:</strong> ${formData.pret}</p>
            <p><strong>Suprafața:</strong> ${formData.suprafata}</p>
            
            <h4 style="color: #333; margin-top: 20px;">Descriere:</h4>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #DAA520; margin-top: 10px;">
              ${formData.descriere.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          ${formData.images && formData.images.length > 0 ? `
          <div style="background-color: #fff8dc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Imagini Atașate:</h3>
            <p>Au fost atașate <strong>${formData.images.length}</strong> imagini cu proprietatea.</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${formData.images.map(img => `<li>${img.name} (${(img.size / 1024 / 1024).toFixed(2)} MB)</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis prin formularul de colaborare de pe website-ul MVA IMOBILIARE.
          </p>
        </div>
      `,
      attachments: attachments
    });

    console.log("Collaboration email sent successfully via Resend:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Propunerea de colaborare a fost trimisă cu succes!" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-collaboration-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Eroare la trimiterea propunerii. Vă rugăm încercați din nou." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);