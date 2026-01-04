import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  propertyTitle: string;
  propertyLocation?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalPrice: number;
  currency: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationRequest = await req.json();
    console.log("Received booking notification request:", data);

    const {
      propertyTitle,
      propertyLocation,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      numGuests,
      totalPrice,
      currency,
      notes,
    } = data;

    // Format dates for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ro-RO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Send notification to admin
    const emailResponse = await resend.emails.send({
      from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
      to: ["contact@mvaimobiliare.ro"],
      subject: `🏨 Rezervare nouă: ${propertyTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #C9A351, #E5C778); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #C9A351; margin-bottom: 10px; border-bottom: 2px solid #C9A351; padding-bottom: 5px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: bold; width: 120px; color: #666; }
            .info-value { flex: 1; }
            .highlight { background: #C9A351; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .highlight .price { font-size: 28px; font-weight: bold; }
            .notes { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Rezervare Nouă</h1>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">📍 Proprietate</div>
                <div class="info-row">
                  <span class="info-label">Nume:</span>
                  <span class="info-value"><strong>${propertyTitle}</strong></span>
                </div>
                ${propertyLocation ? `
                <div class="info-row">
                  <span class="info-label">Locație:</span>
                  <span class="info-value">${propertyLocation}</span>
                </div>
                ` : ''}
              </div>

              <div class="section">
                <div class="section-title">📅 Perioada</div>
                <div class="info-row">
                  <span class="info-label">Check-in:</span>
                  <span class="info-value">${formatDate(checkIn)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Check-out:</span>
                  <span class="info-value">${formatDate(checkOut)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Nopți:</span>
                  <span class="info-value"><strong>${nights} ${nights === 1 ? 'noapte' : 'nopți'}</strong></span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">👤 Oaspete</div>
                <div class="info-row">
                  <span class="info-label">Nume:</span>
                  <span class="info-value"><strong>${guestName}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Telefon:</span>
                  <span class="info-value"><a href="tel:${guestPhone}">${guestPhone}</a></span>
                </div>
                ${guestEmail ? `
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value"><a href="mailto:${guestEmail}">${guestEmail}</a></span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Nr. oaspeți:</span>
                  <span class="info-value">${numGuests}</span>
                </div>
              </div>

              <div class="highlight">
                <div>Preț Total</div>
                <div class="price">${totalPrice.toLocaleString()} ${currency}</div>
              </div>

              ${notes ? `
              <div class="notes">
                <strong>📝 Note de la oaspete:</strong><br>
                ${notes}
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>Acest email a fost generat automat de MVA Imobiliare.</p>
              <p>Pentru a gestiona rezervarea, accesați panoul de administrare.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-notification function:", error);
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
