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
  contractType: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
  signerPartyType: string;
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

    const { contractId, contractType, signerPartyType }: NotifyContractSignedRequest = await req.json();

    console.log(`Processing notification for ${contractType} contract ${contractId}, signer: ${signerPartyType}`);

    if (!contractId || !contractType) {
      return new Response(
        JSON.stringify({ error: "Missing contractId or contractType" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let propertyAddress = "";
    let signerName = "";
    let otherPartyName = "";
    let otherPartyType = "";
    let bothSigned = false;
    let contractLabel = "";

    // Fetch contract based on type
    switch (contractType) {
      case "inchiriere": {
        const { data: contract, error } = await supabaseClient
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error || !contract) {
          console.error("Contract not found:", error);
          return new Response(
            JSON.stringify({ error: "Contract not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        propertyAddress = contract.property_address || "Proprietate";
        const proprietarName = `${contract.proprietar_prenume || ''} ${contract.proprietar_name || ''}`.trim() || "Proprietar";
        const chiriasName = `${contract.client_prenume || ''} ${contract.client_name || ''}`.trim() || "Chiriaș";

        if (signerPartyType === "proprietar") {
          signerName = proprietarName;
          otherPartyName = chiriasName;
          otherPartyType = "Chiriaș";
        } else {
          signerName = chiriasName;
          otherPartyName = proprietarName;
          otherPartyType = "Proprietar";
        }

        bothSigned = contract.proprietar_signed && contract.chirias_signed;
        contractLabel = "Contract Închiriere";
        break;
      }

      case "comodat": {
        const { data: contract, error } = await supabaseClient
          .from("comodat_contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error || !contract) {
          console.error("Contract not found:", error);
          return new Response(
            JSON.stringify({ error: "Contract not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        propertyAddress = contract.property_address || "Proprietate";
        const comodantName = `${contract.comodant_prenume || ''} ${contract.comodant_name || ''}`.trim() || "Comodant";
        const comodatarName = `${contract.comodatar_prenume || ''} ${contract.comodatar_name || ''}`.trim() || "Comodatar";

        if (signerPartyType === "comodant") {
          signerName = comodantName;
          otherPartyName = comodatarName;
          otherPartyType = "Comodatar";
        } else {
          signerName = comodatarName;
          otherPartyName = comodantName;
          otherPartyType = "Comodant";
        }

        bothSigned = !!contract.comodant_signed_at && !!contract.comodatar_signed_at;
        contractLabel = "Contract Comodat";
        break;
      }

      case "exclusiv": {
        const { data: contract, error } = await supabaseClient
          .from("exclusive_contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error || !contract) {
          console.error("Contract not found:", error);
          return new Response(
            JSON.stringify({ error: "Contract not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        propertyAddress = contract.property_address || "Proprietate";
        const beneficiaryName = `${contract.beneficiary_prenume || ''} ${contract.beneficiary_name || ''}`.trim() || "Beneficiar";
        const agentName = "MVA Imobiliare (Agent)";

        if (signerPartyType === "beneficiary") {
          signerName = beneficiaryName;
          otherPartyName = agentName;
          otherPartyType = "Agent";
        } else {
          signerName = agentName;
          otherPartyName = beneficiaryName;
          otherPartyType = "Beneficiar";
        }

        bothSigned = !!contract.beneficiary_signed_at && !!contract.agent_signed_at;
        contractLabel = "Contract Reprezentare Exclusivă";
        break;
      }

      case "intermediere": {
        const { data: contract, error } = await supabaseClient
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error || !contract) {
          console.error("Contract not found:", error);
          return new Response(
            JSON.stringify({ error: "Contract not found" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        propertyAddress = contract.property_address || "Proprietate";
        const clientName = `${contract.client_prenume || ''} ${contract.client_name || ''}`.trim() || "Client";
        const intermediarName = "MVA Imobiliare (Intermediar)";

        if (signerPartyType === "client" || signerPartyType === "chirias") {
          signerName = clientName;
          otherPartyName = intermediarName;
          otherPartyType = "Intermediar";
        } else {
          signerName = intermediarName;
          otherPartyName = clientName;
          otherPartyType = "Client";
        }

        bothSigned = contract.proprietar_signed && contract.chirias_signed;
        contractLabel = "Contract Intermediere";
        break;
      }
    }

    const signerLabel = signerPartyType === "proprietar" ? "Proprietar" :
                        signerPartyType === "chirias" ? "Chiriaș" :
                        signerPartyType === "comodant" ? "Comodant" :
                        signerPartyType === "comodatar" ? "Comodatar" :
                        signerPartyType === "beneficiary" ? "Beneficiar" :
                        signerPartyType === "agent" ? "Agent" :
                        signerPartyType === "client" ? "Client" :
                        signerPartyType === "intermediar" ? "Intermediar" : signerPartyType;

    // Build email HTML
    if (bothSigned) {
      // Both parties signed - send completion notification
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
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">✓ ${contractLabel} Complet Semnat</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">MVA Imobiliare</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Contractul a fost semnat de ambele părți!</h2>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #166534; margin: 0; font-weight: 500;">Detalii Contract:</p>
                  <p style="color: #166534; margin: 10px 0 0 0;"><strong>Tip:</strong> ${contractLabel}</p>
                  <p style="color: #166534; margin: 5px 0 0 0;"><strong>Proprietate:</strong> ${propertyAddress}</p>
                </div>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 20px 0;">
                  Contractul a fost semnat digital de ambele părți și este acum valid. 
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

      try {
        const emailResponse = await resend.emails.send({
          from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
          to: ["contact@mvaimobiliare.ro"],
          subject: `✓ ${contractLabel} Complet Semnat - ${propertyAddress}`,
          html: completionHtml,
        });
        console.log("Completion notification sent:", emailResponse);
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

    // Single party signed - send partial notification
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
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">📝 Semnătură Nouă - ${contractLabel}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">MVA Imobiliare</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">O parte a semnat contractul!</h2>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #92400e; margin: 0;"><strong>${signerName}</strong> (${signerLabel}) a semnat contractul pentru:</p>
                <p style="color: #92400e; margin: 10px 0 0 0; font-weight: 500;">${propertyAddress}</p>
              </div>
              
              <p style="color: #4a4a4a; line-height: 1.6; margin: 20px 0;">
                Se așteaptă semnătura celeilalte părți (<strong>${otherPartyType}</strong>) pentru finalizarea contractului.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://mvaimobiliare.ro/admin/contracte" 
                   style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
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

    try {
      const emailResponse = await resend.emails.send({
        from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
        to: ["contact@mvaimobiliare.ro"],
        subject: `📝 ${contractLabel} Semnat Parțial - ${signerName} (${signerLabel})`,
        html: partialSignHtml,
      });
      console.log("Partial sign notification sent:", emailResponse);
    } catch (emailErr) {
      console.error("Error sending partial sign email:", emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notificare trimisă pentru semnarea de către ${signerLabel}`,
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
