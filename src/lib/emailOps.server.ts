/**
 * Server-only implementations of the email/notification edge functions (wave 3).
 * Ports: send-signature-link, notify-contract-signed, auto-generate-signed-contract,
 *        reply-email, send-transactional-email, send-collaboration-email,
 *        send-viewing-notification, send-conversations.
 *
 * Behaviour (payload keys, response shapes) is kept identical to the original
 * Supabase Edge Functions so existing call sites keep working.
 */

import { sendMailgunEmail, getFromAddressForFunction, formatFromAddress } from "@/lib/email.server";

type AnyRecord = Record<string, unknown>;

/** Loosely typed service-role client (generic table names + tables missing from generated types). */
async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (table: string) => any;
    rpc: (name: string, args?: AnyRecord) => any;
    storage: {
      from: (bucket: string) => any;
    };
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/* ------------------------------------------------------------------ */
/* send-signature-link                                                  */
/* ------------------------------------------------------------------ */

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

export async function sendSignatureLink(body: AnyRecord): Promise<AnyRecord> {
  const supabaseClient = await db();
  const {
    contractId,
    contractType,
    partyType,
    recipientEmail,
    recipientName,
    propertyAddress,
  } = body as {
    contractId?: string;
    contractType?: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
    partyType?: string;
    recipientEmail?: string;
    recipientName?: string;
    propertyAddress?: string;
  };

  if (!contractId || !contractType || !partyType || !recipientEmail) {
    return {
      error: "Missing required fields: contractId, contractType, partyType, recipientEmail",
      __status: 400,
    };
  }

  let signatureToken: string | null = null;
  let alreadySigned = false;

  if (contractType === "inchiriere") {
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
      await supabaseClient
        .from("contract_signatures")
        .update({ signer_email: recipientEmail })
        .eq("contract_id", contractId)
        .eq("party_type", partyType);
    } else {
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
        return { error: "Failed to create signature entry", __status: 500 };
      }
      signatureToken = newSig.signature_token;
    }
  } else if (contractType === "comodat") {
    const signatureField = partyType === "comodant" ? "comodant_signed_at" : "comodatar_signed_at";

    const { data: contract, error: contractError } = await supabaseClient
      .from("comodat_contracts")
      .select("id, " + signatureField)
      .eq("id", contractId)
      .maybeSingle();

    if (contractError || !contract) {
      console.error("Error fetching comodat contract:", contractError);
      return { error: "Contract not found", __status: 404 };
    }

    alreadySigned = !!(contract as any)[signatureField];
    signatureToken = `${contractType}_${contractId}_${partyType}`;
  } else if (contractType === "exclusiv") {
    const signatureField = partyType === "beneficiary" ? "beneficiary_signed_at" : "agent_signed_at";

    const { data: contract, error: contractError } = await supabaseClient
      .from("exclusive_contracts")
      .select("id, " + signatureField)
      .eq("id", contractId)
      .maybeSingle();

    if (contractError || !contract) {
      console.error("Error fetching exclusive contract:", contractError);
      return { error: "Contract not found", __status: 404 };
    }

    alreadySigned = !!(contract as any)[signatureField];
    signatureToken = `${contractType}_${contractId}_${partyType}`;
  } else if (contractType === "intermediere") {
    const signatureField = partyType === "client" ? "chirias_signed" : "proprietar_signed";

    const { data: contract, error: contractError } = await supabaseClient
      .from("contracts")
      .select("id, " + signatureField)
      .eq("id", contractId)
      .eq("contract_type", "intermediere")
      .maybeSingle();

    if (contractError || !contract) {
      console.error("Error fetching intermediation contract:", contractError);
      return { error: "Contract not found", __status: 404 };
    }

    alreadySigned = !!(contract as any)[signatureField];
    signatureToken = `${contractType}_${contractId}_${partyType}`;
  }

  if (!signatureToken) {
    return { error: "Could not generate signature token", __status: 500 };
  }

  if (alreadySigned) {
    return { error: "Acest contract a fost deja semnat de această parte", __status: 400 };
  }

  const signatureUrl = `https://www.mvaimobiliare.ro/sign/${signatureToken}`;

  const contractTypeLabel = getContractTypeLabel(contractType);
  const partyLabel = getPartyLabel(contractType, partyType);

  const result = await sendMailgunEmail({
    to: [recipientEmail],
    subject: `Semnătură Contract ${contractTypeLabel} - ${(propertyAddress || "Proprietate").replace(/[\n\r]/g, " ").trim()}`,
    from: formatFromAddress("noreply@mvaimobiliare.ro", "MVA Imobiliare"),
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
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Contract de ${contractTypeLabel}</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Bună ziua${recipientName ? `, ${recipientName}` : ""},</h2>
                
                <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                  Ați primit acest email pentru a semna electronic contractul de ${contractTypeLabel.toLowerCase()} în calitate de <strong>${partyLabel}</strong>.
                </p>
                
                ${propertyAddress ? `
                <div style="background-color: #f8f9fa; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #666; margin: 0; font-size: 13px;">${contractType === "intermediere" ? "Criterii căutare:" : "Proprietate:"}</p>
                  <p style="color: #1a1a1a; margin: 5px 0 0 0; font-weight: 500;">${propertyAddress}</p>
                </div>
                ` : ""}
                
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

  if (!result.success) {
    return { error: result.error || "Failed to send email", __status: 500 };
  }

  return {
    success: true,
    message: `Email trimis cu succes către ${recipientEmail}`,
    emailId: result.messageId,
  };
}

/* ------------------------------------------------------------------ */
/* notify-contract-signed                                               */
/* ------------------------------------------------------------------ */

export async function notifyContractSigned(body: AnyRecord): Promise<AnyRecord> {
  const supabaseClient = await db();
  const { contractId, contractType, signerPartyType } = body as {
    contractId?: string;
    contractType?: "inchiriere" | "comodat" | "exclusiv" | "intermediere";
    signerPartyType?: string;
  };

  if (!contractId || !contractType) {
    return { error: "Missing contractId or contractType", __status: 400 };
  }

  const fromAddress = await getFromAddressForFunction("contracts");

  let propertyAddress = "";
  let signerName = "";
  let otherPartyName = "";
  let otherPartyType = "";
  let bothSigned = false;
  let contractLabel = "";

  switch (contractType) {
    case "inchiriere": {
      const { data: contract, error } = await supabaseClient
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (error || !contract) {
        console.error("Contract not found:", error);
        return { error: "Contract not found", __status: 404 };
      }

      propertyAddress = contract.property_address || "Proprietate";
      const proprietarName = `${contract.proprietar_prenume || ""} ${contract.proprietar_name || ""}`.trim() || "Proprietar";
      const chiriasName = `${contract.client_prenume || ""} ${contract.client_name || ""}`.trim() || "Chiriaș";

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
        return { error: "Contract not found", __status: 404 };
      }

      propertyAddress = contract.property_address || "Proprietate";
      const comodantName = `${contract.comodant_prenume || ""} ${contract.comodant_name || ""}`.trim() || "Comodant";
      const comodatarName = `${contract.comodatar_prenume || ""} ${contract.comodatar_name || ""}`.trim() || "Comodatar";

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
        return { error: "Contract not found", __status: 404 };
      }

      propertyAddress = contract.property_address || "Proprietate";
      const beneficiaryName = `${contract.beneficiary_prenume || ""} ${contract.beneficiary_name || ""}`.trim() || "Beneficiar";
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
        return { error: "Contract not found", __status: 404 };
      }

      propertyAddress = contract.property_address || "Proprietate";
      const clientName = `${contract.client_prenume || ""} ${contract.client_name || ""}`.trim() || "Client";
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

  const signerLabel =
    signerPartyType === "proprietar" ? "Proprietar" :
    signerPartyType === "chirias" ? "Chiriaș" :
    signerPartyType === "comodant" ? "Comodant" :
    signerPartyType === "comodatar" ? "Comodatar" :
    signerPartyType === "beneficiary" ? "Beneficiar" :
    signerPartyType === "agent" ? "Agent" :
    signerPartyType === "client" ? "Client" :
    signerPartyType === "intermediar" ? "Intermediar" : signerPartyType;

  if (bothSigned) {
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
                  <a href="https://www.mvaimobiliare.ro/admin/contracte" 
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
      const emailResponse = await sendMailgunEmail({
        to: ["contact@mvaimobiliare.ro"],
        subject: `✓ ${contractLabel} Complet Semnat - ${propertyAddress}`,
        html: completionHtml,
        from: fromAddress,
      });
      console.log("Completion notification sent:", emailResponse);
    } catch (emailErr) {
      console.error("Error sending completion email:", emailErr);
    }

    return {
      success: true,
      message: "Notificări de completare trimise cu succes",
      bothSigned: true,
    };
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
                <a href="https://www.mvaimobiliare.ro/admin/contracte" 
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
    const emailResponse = await sendMailgunEmail({
      to: ["contact@mvaimobiliare.ro"],
      subject: `📝 ${contractLabel} Semnat Parțial - ${signerName} (${signerLabel})`,
      html: partialSignHtml,
      from: fromAddress,
    });
    console.log("Partial sign notification sent:", emailResponse);
  } catch (emailErr) {
    console.error("Error sending partial sign email:", emailErr);
  }

  return {
    success: true,
    message: `Notificare trimisă pentru semnarea de către ${signerLabel}`,
    signerPartyType,
  };
}

/* ------------------------------------------------------------------ */
/* auto-generate-signed-contract                                       */
/* ------------------------------------------------------------------ */

export async function autoGenerateSignedContract(body: AnyRecord): Promise<AnyRecord> {
  const supabase = await db();
  const { contractId } = body as { contractId?: string };

  if (!contractId) {
    return { error: "contractId is required", __status: 400 };
  }

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();

  if (contractError || !contract) {
    console.error("Error fetching contract:", contractError);
    return { error: "Contract not found", __status: 404 };
  }

  if (!contract.proprietar_signed || !contract.chirias_signed) {
    return { message: "Not all parties have signed yet", bothSigned: false };
  }

  const { data: signatures, error: sigError } = await supabase
    .from("contract_signatures")
    .select("party_type, signature_data, signer_name, signer_email")
    .eq("contract_id", contractId);

  if (sigError) {
    console.error("Error fetching signatures:", sigError);
    return { error: "Error fetching signatures", __status: 500 };
  }

  const proprietarSig = signatures?.find((s: any) => s.party_type === "proprietar");
  const chiriasSig = signatures?.find((s: any) => s.party_type === "chirias");
  const proprietarSignature = proprietarSig?.signature_data;
  const chiriasSignature = chiriasSig?.signature_data;

  if (!proprietarSignature || !chiriasSignature) {
    return { message: "Missing signature data", bothSigned: false };
  }

  const { data: inventoryItems, error: invError } = await supabase
    .from("contract_inventory")
    .select("*")
    .eq("contract_id", contractId);

  if (invError) {
    console.error("Error fetching inventory:", invError);
  }

  const inventory = inventoryItems || [];

  const { error: updateError } = await supabase
    .from("contracts")
    .update({ pdf_generated: true })
    .eq("id", contractId);

  if (updateError) {
    console.error("Error updating contract:", updateError);
  }

  const propertyAddress = contract.property_address || "Proprietate";
  const proprietarName = `${contract.proprietar_prenume || ""} ${contract.proprietar_name || ""}`.trim() || "Proprietar";
  const chiriasName = `${contract.client_prenume || ""} ${contract.client_name || ""}`.trim() || "Chiriaș";

  const recipientEmails: string[] = ["mvaperfectbusiness@gmail.com"];

  const proprietarEmail = proprietarSig?.signer_email;
  const chiriasEmail = chiriasSig?.signer_email;

  if (proprietarEmail) recipientEmails.push(proprietarEmail);
  if (chiriasEmail) recipientEmails.push(chiriasEmail);

  const proprietarToken = (signatures as any[])?.find((s: any) => s.party_type === "proprietar")?.signature_token;
  const signPageUrl = proprietarToken
    ? `https://www.mvaimobiliare.ro/sign/${proprietarToken}`
    : `https://www.mvaimobiliare.ro/admin/contracte`;

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
                Puteți previzualiza și descărca contractul semnat folosind butonul de mai jos.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signPageUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                  Descarcă Contractul Semnat
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
    const emailResponse = await sendMailgunEmail({
      to: recipientEmails,
      subject: `✓ Contract Complet Semnat - ${propertyAddress}`,
      html: completionHtml,
      from: formatFromAddress("noreply@mvaimobiliare.ro", "MVA Imobiliare"),
    });
    console.log("Completion notification sent:", emailResponse);
  } catch (emailErr) {
    console.error("Error sending completion email:", emailErr);
  }

  return {
    success: true,
    bothSigned: true,
    message: "Both parties have signed. PDF is ready to be generated. Notifications sent.",
    contractId,
    hasInventory: inventory.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* reply-email                                                         */
/* ------------------------------------------------------------------ */

interface EmailAttachment {
  filename: string;
  contentType: string;
  content?: string;
  path?: string;
  bucket?: string;
  url?: string;
  size?: number;
}

export async function replyEmail(body: AnyRecord): Promise<AnyRecord> {
  const supabase = await db();
  const {
    to,
    cc,
    bcc,
    subject,
    body: bodyText,
    inReplyTo,
    attachments,
    isReply,
    replyFromAddress,
  } = body as {
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
    inReplyTo?: string;
    attachments?: EmailAttachment[];
    isReply?: boolean;
    replyFromAddress?: string;
  };

  if (!to || !bodyText) {
    return { error: "Missing required fields: to, body", __status: 400 };
  }

  let fromAddress: string;

  if (isReply && replyFromAddress) {
    const emailMatch = replyFromAddress.match(/<([^>]+)>/);
    fromAddress = `MVA Imobiliare <${emailMatch ? emailMatch[1] : replyFromAddress}>`;
  } else {
    fromAddress = await getFromAddressForFunction("contact");
  }

  const customHeaders: Record<string, string> = {};
  if (inReplyTo) {
    customHeaders["In-Reply-To"] = inReplyTo;
    customHeaders["References"] = inReplyTo;
  }

  const isHtml = bodyText.trim().startsWith("<");
  const bodyHtml = isHtml
    ? bodyText
    : bodyText.split("\n").map((line) => `<p style="margin: 0 0 10px 0;">${line || "&nbsp;"}</p>`).join("");

  const fullHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        ${bodyHtml}
        <br/>
        <p style="color: #666; font-size: 12px;">
          —<br/>
          MVA Imobiliare<br/>
          <a href="https://www.mvaimobiliare.ro" style="color: #C6A052;">mvaimobiliare.ro</a>
        </p>
      </div>
    `;

  const normalizedForMailgun: Array<{ filename: string; content: string; contentType: string }> = [];
  const storageMeta: Record<string, { path?: string; url?: string; bucket?: string; size?: number }> = {};

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      if (!att.filename) continue;
      const bucket = att.bucket || "email-attachments";
      try {
        if (att.content) {
          normalizedForMailgun.push({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType || "application/octet-stream",
          });
        } else if (att.path) {
          const { data: fileData, error: dlErr } = await supabase.storage.from(bucket).download(att.path);
          if (dlErr || !fileData) {
            console.error(`[reply-email] Failed to download pre-uploaded attachment "${att.filename}":`, dlErr);
            continue;
          }
          const buf = new Uint8Array(await fileData.arrayBuffer());
          normalizedForMailgun.push({
            filename: att.filename,
            content: bytesToBase64(buf),
            contentType: att.contentType || fileData.type || "application/octet-stream",
          });
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(att.path);
          storageMeta[att.filename] = {
            path: att.path,
            url: att.url || urlData.publicUrl,
            bucket,
            size: att.size ?? buf.length,
          };
        }
      } catch (e) {
        console.error(`[reply-email] Error normalizing attachment "${att.filename}":`, e);
      }
    }
  }

  const result = await sendMailgunEmail({
    to,
    cc: cc || undefined,
    bcc: bcc || undefined,
    subject: subject || "(Fără subiect)",
    from: fromAddress,
    html: fullHtml,
    customHeaders,
    attachments: normalizedForMailgun,
  });

  if (!result.success) {
    return { error: result.error || "Failed to send email", __status: 500 };
  }

  const diagnostics: {
    requestedAttachments: number;
    uploaded: Array<{ name: string; size: number; path: string }>;
    reused: Array<{ name: string; size: number; path: string }>;
    failed: Array<{ name: string; reason: string }>;
    skipped: Array<{ name?: string; reason: string }>;
    dbInsert: "ok" | "error" | "skipped";
    dbError?: string;
  } = {
    requestedAttachments: attachments?.length || 0,
    uploaded: [],
    reused: [],
    failed: [],
    skipped: [],
    dbInsert: "skipped",
  };

  try {
    const sentEmailId = crypto.randomUUID();
    const storedAttachments: any[] = [];

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        try {
          if (!att.filename) {
            diagnostics.skipped.push({ name: att?.filename, reason: "missing filename" });
            continue;
          }

          const meta = storageMeta[att.filename];
          if (meta) {
            storedAttachments.push({
              name: att.filename,
              size: meta.size ?? att.size ?? 0,
              type: att.contentType || "application/octet-stream",
              url: meta.url || null,
              path: meta.path || null,
              bucket: meta.bucket || "email-attachments",
            });
            diagnostics.reused.push({ name: att.filename, size: meta.size ?? 0, path: meta.path || "" });
            continue;
          }

          if (!att.content) {
            diagnostics.skipped.push({ name: att.filename, reason: "missing content and storage path" });
            continue;
          }

          let base64Content = att.content;
          if (base64Content.includes(",")) base64Content = base64Content.split(",")[1];
          const binaryString = atob(base64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

          const sanitizedName = att.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filePath = `${sentEmailId}/${sanitizedName}`;

          const { error: upErr } = await supabase.storage.from("email-attachments").upload(filePath, bytes, {
            contentType: att.contentType || "application/octet-stream",
            upsert: true,
          });

          if (upErr) {
            console.error(`[reply-email] Upload FAILED for "${att.filename}":`, upErr);
            diagnostics.failed.push({ name: att.filename, reason: upErr.message || String(upErr) });
            storedAttachments.push({
              name: att.filename,
              size: bytes.length,
              type: att.contentType || "application/octet-stream",
              url: null,
              path: null,
              bucket: "email-attachments",
            });
            continue;
          }

          const { data: urlData } = supabase.storage.from("email-attachments").getPublicUrl(filePath);

          diagnostics.uploaded.push({ name: att.filename, size: bytes.length, path: filePath });

          storedAttachments.push({
            name: att.filename,
            size: bytes.length,
            type: att.contentType || "application/octet-stream",
            url: urlData.publicUrl,
            path: filePath,
            bucket: "email-attachments",
          });
        } catch (e) {
          console.error(`[reply-email] Exception while storing attachment "${att?.filename}":`, e);
          diagnostics.failed.push({ name: att?.filename || "unknown", reason: String(e) });
        }
      }
    }

    const { error: insertError } = await supabase.from("sent_emails").insert({
      id: sentEmailId,
      recipient: to,
      cc: cc || null,
      bcc: bcc || null,
      subject: subject || "(Fără subiect)",
      body_html: fullHtml,
      body_plain: bodyText,
      from_address: fromAddress,
      message_id: result.messageId || null,
      in_reply_to: inReplyTo || null,
      attachments: storedAttachments,
      sent_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[reply-email] DB insert FAILED:", insertError);
      diagnostics.dbInsert = "error";
      diagnostics.dbError = insertError.message;
    } else {
      diagnostics.dbInsert = "ok";
    }
  } catch (saveError) {
    console.error("[reply-email] Unexpected error saving sent email:", saveError);
    diagnostics.dbInsert = "error";
    diagnostics.dbError = String(saveError);
  }

  return { success: true, messageId: result.messageId, diagnostics };
}

/* ------------------------------------------------------------------ */
/* send-transactional-email                                            */
/* ------------------------------------------------------------------ */

const TX_BRAND = {
  gold: "#DAA520",
  goldDark: "#B8860B",
  dark: "#1a1a1a",
  darkAlt: "#2d2d2d",
  white: "#ffffff",
  lightBg: "#f8f9fa",
  grey: "#666666",
  greyLight: "#888888",
  green: "#22c55e",
  greenDark: "#16a34a",
};

function txEmailWrapper(title: string, subtitle: string, bodyHtml: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: ${TX_BRAND.lightBg};">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${TX_BRAND.dark} 0%, ${TX_BRAND.darkAlt} 100%); padding: 30px; text-align: center;">
      <h1 style="color: ${TX_BRAND.gold}; margin: 0; font-size: 24px; letter-spacing: 2px;">MVA IMOBILIARE</h1>
      <p style="color: ${TX_BRAND.greyLight}; margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">${subtitle}</p>
    </div>
    <!-- Body -->
    <div style="background-color: ${TX_BRAND.white}; padding: 40px 30px;">
      <h2 style="color: ${TX_BRAND.dark}; margin: 0 0 20px 0; font-size: 22px;">${title}</h2>
      ${bodyHtml}
    </div>
    <!-- Footer -->
    <div style="background-color: ${TX_BRAND.dark}; padding: 20px 30px; text-align: center;">
      <p style="color: ${TX_BRAND.grey}; margin: 0; font-size: 12px;">Acest email a fost trimis automat de MVA Imobiliare.</p>
      <p style="color: ${TX_BRAND.gold}; margin: 10px 0 0 0; font-size: 11px;">© ${new Date().getFullYear()} MVA IMOBILIARE</p>
    </div>
  </div>
</body>
</html>`;
}

function txWelcomeEmail(data: { name: string; email: string }) {
  const bodyHtml = `
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">
      Bine ai venit, <strong>${data.name}</strong>! 🎉
    </p>
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">
      Contul tău pe platforma MVA Imobiliare a fost creat cu succes. Acum poți:
    </p>
    <ul style="color: #4a4a4a; line-height: 2; padding-left: 20px; margin: 0 0 25px 0;">
      <li>Salva proprietăți la favorite</li>
      <li>Programa vizionări online</li>
      <li>Primi notificări pentru proprietăți noi</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.mvaimobiliare.ro/proprietati" 
         style="display: inline-block; background: linear-gradient(135deg, ${TX_BRAND.gold} 0%, ${TX_BRAND.goldDark} 100%); color: ${TX_BRAND.white}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
        Explorează Proprietăți
      </a>
    </div>
    <p style="color: #999; font-size: 13px; margin: 20px 0 0 0;">
      Dacă ai întrebări, ne poți contacta oricând la <a href="mailto:contact@mvaimobiliare.ro" style="color: ${TX_BRAND.gold};">contact@mvaimobiliare.ro</a> sau la <a href="tel:+40769272272" style="color: ${TX_BRAND.gold};">0769 272 272</a>.
    </p>`;
  return {
    subject: `Bine ai venit la MVA Imobiliare, ${data.name}! 🏠`,
    html: txEmailWrapper("Bine ai venit!", "Cont Nou", bodyHtml),
  };
}

function txContractSignedEmail(data: {
  propertyAddress: string;
  proprietarName: string;
  chiriasName: string;
  contractType?: string;
  recipientType: "proprietar" | "chirias" | "admin";
}) {
  const recipientGreeting = data.recipientType === "admin"
    ? "Ambele părți au semnat contractul."
    : "Contractul a fost semnat de ambele părți și este acum valid.";

  const bodyHtml = `
    <div style="background-color: #f0fdf4; border-left: 4px solid ${TX_BRAND.green}; padding: 15px; margin: 0 0 25px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #166534; margin: 0; font-weight: 600;">✓ Contract complet semnat</p>
    </div>
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">${recipientGreeting}</p>
    <div style="background-color: ${TX_BRAND.lightBg}; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <table style="width: 100%;">
        <tr><td style="padding: 8px 0; color: ${TX_BRAND.grey};">Proprietate:</td><td style="padding: 8px 0; color: ${TX_BRAND.dark}; font-weight: bold;">${data.propertyAddress}</td></tr>
        <tr><td style="padding: 8px 0; color: ${TX_BRAND.grey};">Proprietar:</td><td style="padding: 8px 0; color: ${TX_BRAND.dark}; font-weight: bold;">${data.proprietarName}</td></tr>
        <tr><td style="padding: 8px 0; color: ${TX_BRAND.grey};">Chiriaș:</td><td style="padding: 8px 0; color: ${TX_BRAND.dark}; font-weight: bold;">${data.chiriasName}</td></tr>
      </table>
    </div>
    ${data.recipientType === "admin" ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.mvaimobiliare.ro/admin/contracte" 
         style="display: inline-block; background: linear-gradient(135deg, ${TX_BRAND.gold} 0%, ${TX_BRAND.goldDark} 100%); color: ${TX_BRAND.white}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Vezi Contract în Admin
      </a>
    </div>` : `
    <p style="color: #4a4a4a; line-height: 1.8;">
      Documentul PDF final poate fi descărcat de la agentul dumneavoastră MVA Imobiliare.
    </p>`}`;
  return {
    subject: `✓ Contract Complet Semnat - ${data.propertyAddress}`,
    html: txEmailWrapper("Contract Semnat cu Succes", "Notificare Contract", bodyHtml),
  };
}

function txViewingConfirmationEmail(data: {
  customerName: string;
  propertyTitle: string;
  preferredDate: string;
  preferredTime: string;
  propertyLink?: string;
}) {
  const formattedDate = new Date(data.preferredDate).toLocaleDateString("ro-RO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const bodyHtml = `
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">
      Bună, <strong>${data.customerName}</strong>! 👋
    </p>
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 25px 0;">
      Cererea ta de vizionare a fost înregistrată cu succes. Un agent MVA te va contacta în curând pentru confirmare.
    </p>
    <div style="background: linear-gradient(135deg, ${TX_BRAND.gold} 0%, ${TX_BRAND.goldDark} 100%); padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: ${TX_BRAND.white}; margin: 0 0 15px 0; font-size: 16px;">📍 Detalii Vizionare</h3>
      <table style="width: 100%;">
        <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.8);">Proprietate:</td><td style="padding: 6px 0; color: ${TX_BRAND.white}; font-weight: bold;">${data.propertyTitle}</td></tr>
        <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.8);">Data preferată:</td><td style="padding: 6px 0; color: ${TX_BRAND.white}; font-weight: bold;">${formattedDate}</td></tr>
        <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.8);">Ora preferată:</td><td style="padding: 6px 0; color: ${TX_BRAND.white}; font-weight: bold;">${data.preferredTime}</td></tr>
      </table>
    </div>
    ${data.propertyLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.propertyLink}" 
         style="display: inline-block; background: linear-gradient(135deg, ${TX_BRAND.dark} 0%, ${TX_BRAND.darkAlt} 100%); color: ${TX_BRAND.gold}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 1px solid ${TX_BRAND.gold};">
        Vezi Proprietatea
      </a>
    </div>` : ""}
    <p style="color: #999; font-size: 13px; margin: 20px 0 0 0;">
      Dacă dorești să modifici sau anulezi vizionarea, contactează-ne la <a href="tel:+40769272272" style="color: ${TX_BRAND.gold};">0769 272 272</a>.
    </p>`;
  return {
    subject: `Confirmare vizionare - ${data.propertyTitle}`,
    html: txEmailWrapper("Vizionare Programată", "Confirmare Programare", bodyHtml),
  };
}

export async function sendTransactionalEmail(body: AnyRecord): Promise<AnyRecord> {
  const { template, data } = body as { template?: string; data?: any };

  let emailContent: { subject: string; html: string };
  let recipients: string[];
  let functionName = "transactional";

  switch (template) {
    case "welcome": {
      emailContent = txWelcomeEmail(data);
      recipients = [data.email];
      functionName = "welcome";
      break;
    }
    case "contract-signed": {
      emailContent = txContractSignedEmail(data);
      recipients = data.recipientEmail ? [data.recipientEmail] : ["contact@mvaimobiliare.ro"];
      functionName = "contract-signed";
      break;
    }
    case "viewing-confirmation": {
      emailContent = txViewingConfirmationEmail(data);
      recipients = [data.customerEmail];
      functionName = "viewing-confirmation";
      break;
    }
    default:
      return { error: `Unknown template: ${template}`, __status: 400 };
  }

  const fromAddress = await getFromAddressForFunction(functionName);

  const result = await sendMailgunEmail({
    to: recipients,
    subject: emailContent.subject,
    html: emailContent.html,
    from: fromAddress,
  });

  if (!result.success) {
    return { error: result.error || "Failed to send email", __status: 500 };
  }

  return { success: true, messageId: result.messageId };
}

/* ------------------------------------------------------------------ */
/* send-collaboration-email                                             */
/* ------------------------------------------------------------------ */

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
    data: string;
  }>;
}

export async function sendCollaborationEmail(body: AnyRecord): Promise<AnyRecord> {
  const formData = body as unknown as CollaborationFormData;

  const attachments = (formData.images || []).map((image) => ({
    filename: image.name,
    content: image.data,
    contentType: image.type,
  }));

  try {
    const result = await sendMailgunEmail({
      to: ["mvaperfectbusiness@gmail.com"],
      subject: `Propunere Colaborare - ${formData.tipProprietate} pentru ${formData.tipTranzactie} în ${formData.adresa}`,
      from: formatFromAddress("noreply@mvaimobiliare.ro", "MVA IMOBILIARE"),
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
              ${formData.descriere.replace(/\n/g, "<br>")}
            </div>
          </div>
          
          ${formData.images && formData.images.length > 0 ? `
          <div style="background-color: #fff8dc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Imagini Atașate:</h3>
            <p>Au fost atașate <strong>${formData.images.length}</strong> imagini cu proprietatea.</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${formData.images.map((img) => `<li>${img.name} (${(img.size / 1024 / 1024).toFixed(2)} MB)</li>`).join("")}
            </ul>
          </div>
          ` : ""}
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis prin formularul de colaborare de pe website-ul MVA IMOBILIARE.
          </p>
        </div>
      `,
      attachments,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    return {
      success: true,
      message: "Propunerea de colaborare a fost trimisă cu succes!",
    };
  } catch (error) {
    console.error("Error in send-collaboration-email function:", error);
    return {
      success: false,
      error: "Eroare la trimiterea propunerii. Vă rugăm încercați din nou.",
      __status: 500,
    };
  }
}

/* ------------------------------------------------------------------ */
/* send-viewing-notification                                           */
/* ------------------------------------------------------------------ */

interface ViewingNotificationData {
  propertyTitle: string;
  propertyLink?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  referenceNumber?: string;
  preferences?: {
    timeSlots?: string[];
    propertyTypes?: string[];
  };
}

export async function sendViewingNotification(body: AnyRecord): Promise<AnyRecord> {
  const data = body as unknown as ViewingNotificationData;

  try {
    const fromAddress = await getFromAddressForFunction("viewing");

    const formattedDate = new Date(data.preferredDate).toLocaleDateString("ro-RO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const refNumber = data.referenceNumber || `MVA-${Date.now().toString(36).toUpperCase()}`;

    const timeSlotLabels = data.preferences?.timeSlots ?? [];
    const propertyTypeLabels = data.preferences?.propertyTypes ?? [];
    const hasPreferences = timeSlotLabels.length > 0 || propertyTypeLabels.length > 0;

    const renderChips = (items: string[]) =>
      items
        .map((item) => `<span style="display: inline-block; padding: 4px 10px; margin: 3px 4px 3px 0; background-color: #DAA520; color: #fff; border-radius: 12px; font-size: 12px; font-weight: 600;">${item}</span>`)
        .join("");

    const preferencesHtml = hasPreferences ? `
      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6f42c1;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">⭐ Preferințe Client</h3>
        ${timeSlotLabels.length ? `
          <div style="margin-bottom: 10px;">
            <p style="color: #666; margin: 0 0 6px 0; font-size: 13px;">Interval orar preferat:</p>
            <div>${renderChips(timeSlotLabels)}</div>
          </div>
        ` : ""}
        ${propertyTypeLabels.length ? `
          <div>
            <p style="color: #666; margin: 0 0 6px 0; font-size: 13px;">Tip proprietate:</p>
            <div>${renderChips(propertyTypeLabels)}</div>
          </div>
        ` : ""}
      </div>
    ` : "";

    const result = await sendMailgunEmail({
      to: ["mvaperfectbusiness@gmail.com"],
      subject: `🏠 [${refNumber}] Cerere vizionare: ${data.propertyTitle}`,
      from: fromAddress,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <h1 style="color: #DAA520; margin: 0; font-size: 24px; letter-spacing: 2px;">MVA IMOBILIARE</h1>
            <p style="color: #888; margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">Cerere de Vizionare</p>
            <p style="color: #DAA520; margin: 12px 0 0 0; font-size: 13px; font-weight: bold; letter-spacing: 1px;">Ref: ${refNumber}</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px; background-color: #f8f9fa;">
            <!-- Property Info -->
            <div style="background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">📍 Proprietate</h2>
              <p style="color: #fff; margin: 10px 0 0 0; font-size: 20px; font-weight: bold;">${data.propertyTitle}</p>
              ${data.propertyLink ? `
              <a href="${data.propertyLink}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background-color: rgba(255,255,255,0.2); color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">🔗 Vezi anunțul</a>
              ` : ""}
            </div>
            
            <!-- Date & Time -->
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #DAA520;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">📅 Data și Ora Preferată</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Data:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Ora:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${data.preferredTime}</td>
                </tr>
              </table>
            </div>
            
            <!-- Customer Info -->
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">👤 Informații Client</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Nume:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Telefon:</td>
                  <td style="padding: 8px 0;">
                    <a href="tel:${data.customerPhone}" style="color: #DAA520; font-weight: bold; text-decoration: none;">${data.customerPhone}</a>
                  </td>
                </tr>
                ${data.customerEmail ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0;">
                    <a href="mailto:${data.customerEmail}" style="color: #DAA520; text-decoration: none;">${data.customerEmail}</a>
                  </td>
                </tr>
                ` : ""}
              </table>
            </div>

            ${preferencesHtml}

            ${data.message ? `
            <!-- Message -->
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">💬 Mesaj Adițional</h3>
              <p style="color: #555; margin: 0; line-height: 1.6;">${data.message.replace(/\n/g, "<br>")}</p>
            </div>
            ` : ""}
          </div>
          
          <!-- Quick Actions -->
          <div style="padding: 20px 30px; background-color: #f0f0f0; text-align: center;">
            <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">Acțiuni rapide:</p>
            <a href="tel:${data.customerPhone}" style="display: inline-block; padding: 12px 25px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">📞 Sună Clientul</a>
            <a href="https://wa.me/${data.customerPhone.replace(/[^0-9]/g, "")}" style="display: inline-block; padding: 12px 25px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">💬 WhatsApp</a>
          </div>
          
          <!-- Footer -->
          <div style="padding: 20px 30px; background-color: #1a1a1a; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              Această notificare a fost generată automat de website-ul MVA IMOBILIARE
            </p>
            <p style="color: #DAA520; margin: 10px 0 0 0; font-size: 11px;">
              © ${new Date().getFullYear()} MVA IMOBILIARE
            </p>
          </div>
        </div>
      `,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    return {
      success: true,
      message: "Notificare trimisă cu succes!",
      referenceNumber: refNumber,
    };
  } catch (error: any) {
    console.error("[send-viewing-notification] Error:", error);
    return {
      success: false,
      error: error?.message || "Eroare la trimiterea notificării",
      __status: 500,
    };
  }
}

/* ------------------------------------------------------------------ */
/* send-conversations                                                   */
/* ------------------------------------------------------------------ */

export async function sendConversations(body: AnyRecord): Promise<AnyRecord> {
  const supabase = await db();
  const { email, startDate, endDate } = body as { email?: string; startDate?: string; endDate?: string };

  try {
    if (!email) {
      throw new Error("Email is required");
    }

    const { data: conversations, error: conversationsError } = await supabase.rpc("get_conversations_summary", {
      start_date: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      end_date: endDate || new Date().toISOString().split("T")[0],
    });

    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError);
      throw new Error("Failed to fetch conversations");
    }

    let emailContent = `
    <h2>Raport Conversații MVA Imobiliare</h2>
    <p><strong>Perioada:</strong> ${startDate || "Ultima săptămână"} - ${endDate || "Azi"}</p>
    <p><strong>Total conversații:</strong> ${conversations?.length || 0}</p>
    <hr>
    `;

    if (conversations && conversations.length > 0) {
      for (const conv of conversations) {
        const { data: messages, error: messagesError } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("session_id", conv.session_id)
          .order("timestamp", { ascending: true });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          continue;
        }

        emailContent += `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>Conversația din ${new Date(conv.conversation_start).toLocaleString("ro-RO")}</h3>
          <p><strong>Total mesaje:</strong> ${conv.message_count}</p>
          <p><strong>Primul mesaj:</strong> "${conv.first_user_message}"</p>
          
          <h4>Conversația completă:</h4>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
        `;

        if (messages) {
          messages.forEach((msg: any) => {
            const isUser = msg.role === "user";
            emailContent += `
            <div style="margin-bottom: 15px; padding: 10px; background: ${isUser ? "#e3f2fd" : "#f3e5f5"}; border-radius: 5px;">
              <strong>${isUser ? "👤 Client" : "🤖 Asistent"}:</strong> ${msg.message}
              <br><small style="color: #666;">${new Date(msg.timestamp).toLocaleString("ro-RO")}</small>
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
      emailContent += "<p>Nu au fost găsite conversații în perioada selectată.</p>";
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email }],
          subject: `Raport Conversații MVA Imobiliare - ${new Date().toLocaleDateString("ro-RO")}`,
        },
      ],
      from: { email: "noreply@mvaimobiliare.ro", name: "MVA Imobiliare" },
      content: [
        {
          type: "text/html",
          value: emailContent,
        },
      ],
    };

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("SendGrid API error:", errorText);
      throw new Error("Failed to send email");
    }

    return {
      success: true,
      message: "Conversațiile au fost trimise cu succes!",
      conversations_count: conversations?.length || 0,
    };
  } catch (error: any) {
    console.error("Error in send-conversations function:", error);
    return {
      error: error?.message || "Internal server error",
      success: false,
      __status: 500,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                           */
/* ------------------------------------------------------------------ */

export const EMAIL_OPS_FUNCTION_NAMES = [
  "send-signature-link",
  "notify-contract-signed",
  "auto-generate-signed-contract",
  "reply-email",
  "send-transactional-email",
  "send-collaboration-email",
  "send-viewing-notification",
  "send-conversations",
] as const;

export type EmailOpsFunctionName = (typeof EMAIL_OPS_FUNCTION_NAMES)[number];

export async function runEmailOpsFunction(fn: EmailOpsFunctionName, body: AnyRecord): Promise<AnyRecord> {
  switch (fn) {
    case "send-signature-link":
      return sendSignatureLink(body);
    case "notify-contract-signed":
      return notifyContractSigned(body);
    case "auto-generate-signed-contract":
      return autoGenerateSignedContract(body);
    case "reply-email":
      return replyEmail(body);
    case "send-transactional-email":
      return sendTransactionalEmail(body);
    case "send-collaboration-email":
      return sendCollaborationEmail(body);
    case "send-viewing-notification":
      return sendViewingNotification(body);
    case "send-conversations":
      return sendConversations(body);
    default:
      return { error: "Invalid function", __status: 400 };
  }
}
