import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSignatureLinkRequest {
  contractId: string;
  contractType: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
  partyType: string; // proprietar, chirias, comodant, comodatar, beneficiary, client
  recipientEmail: string;
  recipientName: string;
  propertyAddress: string;
}

const sendMailgunEmail = async (
  to: string[],
  subject: string,
  html: string,
  from: string = "MVA Imobiliare <noreply@mvaimobiliare.ro>"
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

const getContractTypeLabel = (contractType: string): string => {
  switch (contractType) {
    case "inchiriere": return "Închiriere";
    case "comodat": return "Comodat";
    case "exclusiv": return "Reprezentare Exclusivă";
    case "intermediere": return "Intermediere";
    default: return "Contract";
  }
};

const getPartyLabel = (contractType: string, partyType: string): string => {
  switch (contractType) {
    case "inchiriere":
      return partyType === "proprietar" ? "Proprietar" : "Chiriaș";
    case "comodat":
      return partyType === "comodant" ? "Comodant" : "Comodatar";
    case "exclusiv":
      return partyType === "beneficiary" ? "Beneficiar" : "Prestator";
    case "intermediere":
      return partyType === "client" ? "Client" : "Intermediar";
    default:
      return partyType;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-signature-link function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - JWT first, anon key fallback
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;

    if (authHeader?.startsWith("Bearer ")) {
      const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims?.sub) isAuthorized = true;
      } catch (_) {}
    }
    if (!isAuthorized) {
      const apikeyHeader = req.headers.get("apikey");
      if (apikeyHeader === anonKey) isAuthorized = true;
    }
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contractId, contractType, partyType, recipientEmail, recipientName, propertyAddress }: SendSignatureLinkRequest = await req.json();

    console.log(`Sending signature link for ${contractType} contract ${contractId} to ${partyType}: ${recipientEmail}`);

    if (!contractId || !contractType || !partyType || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contractId, contractType, partyType, recipientEmail" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Determine table and signature handling based on contract type
    let signatureToken: string | null = null;
    let alreadySigned = false;

    if (contractType === "inchiriere") {
      // For rental contracts, check contract_signatures table
      const { data: signature, error: sigError } = await supabaseClient
        .from("contract_signatures")
        .select("signature_token, signed_at")
        .eq("contract_id", contractId)
        .eq("party_type", partyType)
        .maybeSingle();

      if (sigError) {
        console.error("Error fetching signature:", sigError);
      }

      if (signature) {
        signatureToken = signature.signature_token;
        alreadySigned = !!signature.signed_at;
        // Update signer_email if not already set
        await supabaseClient
          .from("contract_signatures")
          .update({ signer_email: recipientEmail })
          .eq("contract_id", contractId)
          .eq("party_type", partyType);
      } else {
        // Create signature entry if not exists
        const { data: newSig, error: createError } = await supabaseClient
          .from("contract_signatures")
          .insert({
            contract_id: contractId,
            party_type: partyType,
            signer_name: recipientName,
            signer_email: recipientEmail,
          })
          .select("signature_token")
          .single();

        if (createError) {
          console.error("Error creating signature entry:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create signature entry" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        signatureToken = newSig.signature_token;
      }
    } else if (contractType === "comodat") {
      // For comodat contracts, use the comodat_contracts table
      const signatureField = partyType === "comodant" ? "comodant_signed_at" : "comodatar_signed_at";
      
      const { data: contract, error: contractError } = await supabaseClient
        .from("comodat_contracts")
        .select("id, " + signatureField)
        .eq("id", contractId)
        .maybeSingle();

      if (contractError || !contract) {
        console.error("Error fetching comodat contract:", contractError);
        return new Response(
          JSON.stringify({ error: "Contract not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      alreadySigned = !!contract[signatureField];
      signatureToken = `${contractType}_${contractId}_${partyType}`;
    } else if (contractType === "exclusiv") {
      // For exclusive contracts
      const signatureField = partyType === "beneficiary" ? "beneficiary_signed_at" : "agent_signed_at";
      
      const { data: contract, error: contractError } = await supabaseClient
        .from("exclusive_contracts")
        .select("id, " + signatureField)
        .eq("id", contractId)
        .maybeSingle();

      if (contractError || !contract) {
        console.error("Error fetching exclusive contract:", contractError);
        return new Response(
          JSON.stringify({ error: "Contract not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      alreadySigned = !!contract[signatureField];
      signatureToken = `${contractType}_${contractId}_${partyType}`;
    } else if (contractType === "intermediere") {
      // For intermediation contracts (stored in contracts table)
      const signatureField = partyType === "client" ? "chirias_signed" : "proprietar_signed";
      
      const { data: contract, error: contractError } = await supabaseClient
        .from("contracts")
        .select("id, " + signatureField)
        .eq("id", contractId)
        .eq("contract_type", "intermediere")
        .maybeSingle();

      if (contractError || !contract) {
        console.error("Error fetching intermediation contract:", contractError);
        return new Response(
          JSON.stringify({ error: "Contract not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      alreadySigned = !!contract[signatureField];
      signatureToken = `${contractType}_${contractId}_${partyType}`;
    }

    if (!signatureToken) {
      return new Response(
        JSON.stringify({ error: "Could not generate signature token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (alreadySigned) {
      return new Response(
        JSON.stringify({ error: "Acest contract a fost deja semnat de această parte" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build the signature URL
    const signatureUrl = contractType === "inchiriere" 
      ? `https://mvaimobiliare.ro/sign/${signatureToken}`
      : `https://mvaimobiliare.ro/sign/${signatureToken}`;

    const contractTypeLabel = getContractTypeLabel(contractType);
    const partyLabel = getPartyLabel(contractType, partyType);

    // Send email with signature link
    const emailResponse = await sendMailgunEmail(
      [recipientEmail],
      `Semnătură Contract ${contractTypeLabel} - ${(propertyAddress || "Proprietate").replace(/[\n\r]/g, ' ').trim()}`,
      `
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
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Contract de ${contractTypeLabel}</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Bună ziua${recipientName ? `, ${recipientName}` : ''},</h2>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                  Ați primit acest email pentru a semna electronic contractul de ${contractTypeLabel.toLowerCase()} în calitate de <strong>${partyLabel}</strong>.
                </p>
                
                ${propertyAddress ? `
                <div style="background-color: #f8f9fa; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #666; margin: 0; font-size: 13px;">${contractType === "intermediere" ? "Criterii căutare:" : "Proprietate:"}</p>
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
      `
    );

    console.log("Email sent successfully via Mailgun:", emailResponse);

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
