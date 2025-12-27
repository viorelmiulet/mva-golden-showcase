import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyContractSignedRequest {
  contractId: string;
  signerPartyType: "proprietar" | "chirias";
  notifyBothPartiesComplete?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-contract-signed function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { contractId, signerPartyType, notifyBothPartiesComplete }: NotifyContractSignedRequest = await req.json();

    console.log(`Processing notification for contract ${contractId}, signer: ${signerPartyType}, bothComplete: ${notifyBothPartiesComplete}`);

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "Missing contractId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch contract details
    const { data: contract, error: contractError } = await supabaseClient
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      console.error("Contract not found:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const propertyAddress = contract.property_address || "Proprietate";
    const proprietarName = `${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`.trim() || "Proprietar";
    const chiriasName = `${contract.client_prenume || ''} ${contract.client_name || ''}`.trim() || "Chiriaș";

    // If both parties have signed, send notification to both
    if (notifyBothPartiesComplete && contract.proprietar_signed && contract.chirias_signed) {
      console.log("Both parties signed - sending completion notifications");

      const emailPromises = [];

      // We need email addresses - check if we have them stored somewhere
      // For now, we'll log this and the admin can see it in the dashboard
      // In production, you'd want to store email addresses in the contract or signatures table

      // Send notification email about completion (to admin or stored emails)
      const completionHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">✓ Contract Complet Semnat</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">MVA Imobiliare</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Contractul a fost semnat de ambele părți!</h2>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #166534; margin: 0; font-weight: 500;">Detalii Contract:</p>
                  <p style="color: #166534; margin: 10px 0 0 0;"><strong>Proprietate:</strong> ${propertyAddress}</p>
                  <p style="color: #166534; margin: 5px 0 0 0;"><strong>Proprietar:</strong> ${proprietarName}</p>
                  <p style="color: #166534; margin: 5px 0 0 0;"><strong>Chiriaș:</strong> ${chiriasName}</p>
                </div>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 20px 0;">
                  Contractul de închiriere a fost semnat digital de ambele părți și este acum valid. 
                  Puteți descărca documentul PDF final din panoul de administrare.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://mvaimobiliare.ro/admin/contracte" 
                     style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                    Vezi Contract în Admin
                  </a>
                </div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                  Acest email a fost trimis automat de MVA Imobiliare.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send to admin email
      try {
        const emailResponse = await resend.emails.send({
          from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
          to: ["contact@mvaimobiliare.ro"], // Admin email
          subject: `✓ Contract Complet Semnat - ${propertyAddress}`,
          html: completionHtml,
        });
        console.log("Completion notification sent to admin:", emailResponse);
      } catch (emailErr) {
        console.error("Error sending completion email:", emailErr);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notificări de completare trimise cu succes",
          bothSigned: true
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Single party signed - notify the other party (if we have their email)
    const otherParty = signerPartyType === "proprietar" ? "chirias" : "proprietar";
    const signerName = signerPartyType === "proprietar" ? proprietarName : chiriasName;
    const otherPartyName = otherParty === "proprietar" ? proprietarName : chiriasName;

    console.log(`${signerName} (${signerPartyType}) signed. Notifying ${otherPartyName} (${otherParty})`);

    // Get signature token for the other party to include link
    const { data: otherSig, error: otherSigError } = await supabaseClient
      .from("contract_signatures")
      .select("signature_token, signed_at")
      .eq("contract_id", contractId)
      .eq("party_type", otherParty)
      .single();

    let signatureUrl = "";
    if (otherSig && !otherSig.signed_at) {
      signatureUrl = `https://mvaimobiliare.ro/sign/${otherSig.signature_token}`;
    }

    const partialSignHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Notificare Semnare Contract</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">MVA Imobiliare</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">O parte a semnat contractul!</h2>
              
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #1e40af; margin: 0;"><strong>${signerName}</strong> (${signerPartyType === 'proprietar' ? 'Proprietar' : 'Chiriaș'}) a semnat contractul pentru:</p>
                <p style="color: #1e40af; margin: 10px 0 0 0; font-weight: 500;">${propertyAddress}</p>
              </div>
              
              <p style="color: #4a4a4a; line-height: 1.6; margin: 20px 0;">
                Se așteaptă semnătura ${otherParty === 'proprietar' ? 'proprietarului' : 'chiriașului'} pentru finalizarea contractului.
              </p>
              
              ${signatureUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signatureUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                  Semnează Acum
                </a>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://mvaimobiliare.ro/admin/contracte" 
                   style="color: #D4AF37; text-decoration: underline; font-size: 14px;">
                  Vezi în Panoul Admin
                </a>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                Acest email a fost trimis automat de MVA Imobiliare.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send notification to admin about partial signing
    try {
      const emailResponse = await resend.emails.send({
        from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
        to: ["contact@mvaimobiliare.ro"], // Admin email
        subject: `Contract Semnat Parțial - ${signerName} (${signerPartyType === 'proprietar' ? 'Proprietar' : 'Chiriaș'})`,
        html: partialSignHtml,
      });
      console.log("Partial sign notification sent:", emailResponse);
    } catch (emailErr) {
      console.error("Error sending partial sign email:", emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notificare trimisă pentru semnarea de către ${signerPartyType}`,
        signerPartyType
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in notify-contract-signed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
