import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSignatureLinkRequest {
  contractId: string;
  partyType: "proprietar" | "chirias";
  recipientEmail: string;
  recipientName: string;
  propertyAddress: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-signature-link function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contractId, partyType, recipientEmail, recipientName, propertyAddress }: SendSignatureLinkRequest = await req.json();

    console.log(`Sending signature link for contract ${contractId} to ${partyType}: ${recipientEmail}`);

    if (!contractId || !partyType || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contractId, partyType, recipientEmail" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get signature token from database
    const { data: signature, error: sigError } = await supabaseClient
      .from("contract_signatures")
      .select("signature_token, signed_at")
      .eq("contract_id", contractId)
      .eq("party_type", partyType)
      .single();

    if (sigError || !signature) {
      console.error("Error fetching signature:", sigError);
      return new Response(
        JSON.stringify({ error: "Signature link not found for this contract" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (signature.signed_at) {
      return new Response(
        JSON.stringify({ error: "This contract has already been signed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build the signature URL - use production domain
    const signatureUrl = `https://mvaimobiliare.ro/sign/${signature.signature_token}`;

    const partyLabel = partyType === "proprietar" ? "Proprietar" : "Chiriaș";

    // Send email with signature link
    const emailResponse = await resend.emails.send({
      from: "MVA Imobiliare <noreply@resend.dev>",
      to: [recipientEmail],
      subject: `Semnătură Contract Închiriere - ${propertyAddress || "Proprietate"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">MVA Imobiliare</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Contract de Închiriere</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Bună ziua${recipientName ? `, ${recipientName}` : ''},</h2>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                  Ați primit acest email pentru a semna electronic contractul de închiriere în calitate de <strong>${partyLabel}</strong>.
                </p>
                
                ${propertyAddress ? `
                <div style="background-color: #f8f9fa; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #666; margin: 0; font-size: 13px;">Proprietate:</p>
                  <p style="color: #1a1a1a; margin: 5px 0 0 0; font-weight: 500;">${propertyAddress}</p>
                </div>
                ` : ''}
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 30px 0;">
                  Pentru a semna contractul, vă rugăm să accesați linkul de mai jos:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signatureUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                    Semnează Contractul
                  </a>
                </div>
                
                <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0;">
                  Dacă butonul nu funcționează, copiați și lipiți acest link în browser:<br>
                  <a href="${signatureUrl}" style="color: #D4AF37; word-break: break-all;">${signatureUrl}</a>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                  Acest email a fost trimis automat. Vă rugăm să nu răspundeți la acest mesaj.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email trimis cu succes către ${recipientEmail}`,
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-signature-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
