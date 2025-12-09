import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ViewingNotificationData {
  propertyTitle: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-viewing-notification] Incoming request", { method: req.method });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    const resend = new Resend(resendApiKey);
    
    const data: ViewingNotificationData = await req.json();
    console.log("[send-viewing-notification] Received data:", {
      propertyTitle: data.propertyTitle,
      customerName: data.customerName,
      preferredDate: data.preferredDate
    });

    // Format date for display
    const formattedDate = new Date(data.preferredDate).toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: "MVA IMOBILIARE <onboarding@resend.dev>",
      to: ["mvaperfectbusiness@gmail.com"],
      subject: `🏠 Cerere vizionare: ${data.propertyTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <h1 style="color: #DAA520; margin: 0; font-size: 24px; letter-spacing: 2px;">MVA IMOBILIARE</h1>
            <p style="color: #888; margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">Cerere de Vizionare</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px; background-color: #f8f9fa;">
            <!-- Property Info -->
            <div style="background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">📍 Proprietate</h2>
              <p style="color: #fff; margin: 10px 0 0 0; font-size: 20px; font-weight: bold;">${data.propertyTitle}</p>
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
    });

    console.log("[send-viewing-notification] Email sent successfully:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notificare trimisă cu succes!" 
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
