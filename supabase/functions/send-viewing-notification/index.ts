import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getFromAddressForFunction } from '../_shared/emailSettings.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  console.log("[send-viewing-notification] Incoming request", { method: req.method });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ViewingNotificationData = await req.json();
    console.log("[send-viewing-notification] Received data:", {
      propertyTitle: data.propertyTitle,
      customerName: data.customerName,
      preferredDate: data.preferredDate
    });

    // Get email sender settings from database
    const fromAddress = await getFromAddressForFunction('viewing');
    console.log("[send-viewing-notification] Using from address:", fromAddress);

    // Format date for display
    const formattedDate = new Date(data.preferredDate).toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const refNumber = data.referenceNumber || `MVA-${Date.now().toString(36).toUpperCase()}`;

    const timeSlotLabels = data.preferences?.timeSlots ?? [];
    const propertyTypeLabels = data.preferences?.propertyTypes ?? [];
    const hasPreferences = timeSlotLabels.length > 0 || propertyTypeLabels.length > 0;

    const renderChips = (items: string[]) => items
      .map(item => `<span style="display: inline-block; padding: 4px 10px; margin: 3px 4px 3px 0; background-color: #DAA520; color: #fff; border-radius: 12px; font-size: 12px; font-weight: 600;">${item}</span>`)
      .join('');

    const preferencesHtml = hasPreferences ? `
      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6f42c1;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">⭐ Preferințe Client</h3>
        ${timeSlotLabels.length ? `
          <div style="margin-bottom: 10px;">
            <p style="color: #666; margin: 0 0 6px 0; font-size: 13px;">Interval orar preferat:</p>
            <div>${renderChips(timeSlotLabels)}</div>
          </div>
        ` : ''}
        ${propertyTypeLabels.length ? `
          <div>
            <p style="color: #666; margin: 0 0 6px 0; font-size: 13px;">Tip proprietate:</p>
            <div>${renderChips(propertyTypeLabels)}</div>
          </div>
        ` : ''}
      </div>
    ` : '';

    const emailResponse = await sendMailgunEmail(
      ["mvaperfectbusiness@gmail.com"],
      `🏠 [${refNumber}] Cerere vizionare: ${data.propertyTitle}`,
      `
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
              ` : ''}
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
                ` : ''}
              </table>
            </div>

            ${preferencesHtml}

            ${data.message ? `
            <!-- Message -->
            <div style="background-color: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">💬 Mesaj Adițional</h3>
              <p style="color: #555; margin: 0; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}
          </div>
          
          <!-- Quick Actions -->
          <div style="padding: 20px 30px; background-color: #f0f0f0; text-align: center;">
            <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">Acțiuni rapide:</p>
            <a href="tel:${data.customerPhone}" style="display: inline-block; padding: 12px 25px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">📞 Sună Clientul</a>
            <a href="https://wa.me/${data.customerPhone.replace(/[^0-9]/g, '')}" style="display: inline-block; padding: 12px 25px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 5px; margin: 5px; font-weight: bold;">💬 WhatsApp</a>
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
      fromAddress
    );

    console.log("[send-viewing-notification] Email sent successfully via Mailgun:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notificare trimisă cu succes!",
      referenceNumber: refNumber
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[send-viewing-notification] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Eroare la trimiterea notificării" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
