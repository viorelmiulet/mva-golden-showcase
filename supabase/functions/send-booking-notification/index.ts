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
  propertyAddress?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalPrice: number;
  currency: string;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationRequest = await req.json();
    console.log("Received booking notification request:", data);

    const {
      propertyTitle,
      propertyLocation,
      propertyAddress,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      numGuests,
      totalPrice,
      currency,
      notes,
      checkInTime = "14:00",
      checkOutTime = "11:00",
    } = data;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Send notification to admin
    const adminEmail = await resend.emails.send({
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
                <div class="info-row"><span class="info-label">Nume:</span><span class="info-value"><strong>${propertyTitle}</strong></span></div>
                ${propertyLocation ? `<div class="info-row"><span class="info-label">Locație:</span><span class="info-value">${propertyLocation}</span></div>` : ''}
              </div>
              <div class="section">
                <div class="section-title">📅 Perioada</div>
                <div class="info-row"><span class="info-label">Check-in:</span><span class="info-value">${formatDate(checkIn)}</span></div>
                <div class="info-row"><span class="info-label">Check-out:</span><span class="info-value">${formatDate(checkOut)}</span></div>
                <div class="info-row"><span class="info-label">Nopți:</span><span class="info-value"><strong>${nights} ${nights === 1 ? 'noapte' : 'nopți'}</strong></span></div>
              </div>
              <div class="section">
                <div class="section-title">👤 Oaspete</div>
                <div class="info-row"><span class="info-label">Nume:</span><span class="info-value"><strong>${guestName}</strong></span></div>
                <div class="info-row"><span class="info-label">Telefon:</span><span class="info-value"><a href="tel:${guestPhone}">${guestPhone}</a></span></div>
                ${guestEmail ? `<div class="info-row"><span class="info-label">Email:</span><span class="info-value"><a href="mailto:${guestEmail}">${guestEmail}</a></span></div>` : ''}
                <div class="info-row"><span class="info-label">Nr. oaspeți:</span><span class="info-value">${numGuests}</span></div>
              </div>
              <div class="highlight">
                <div>Preț Total</div>
                <div class="price">${totalPrice.toLocaleString()} ${currency}</div>
              </div>
              ${notes ? `<div class="notes"><strong>📝 Note:</strong><br>${notes}</div>` : ''}
            </div>
            <div class="footer"><p>Acest email a fost generat automat de MVA Imobiliare.</p></div>
          </div>
        </body>
        </html>
      `,
    });
    console.log("Admin email sent:", adminEmail);

    // Send confirmation email to guest if email provided
    if (guestEmail) {
      const guestEmailResponse = await resend.emails.send({
        from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
        to: [guestEmail],
        subject: `✅ Confirmare cerere rezervare - ${propertyTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #C9A351, #E5C778); padding: 30px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
              .content { padding: 30px 20px; background: #fff; }
              .greeting { font-size: 18px; margin-bottom: 20px; }
              .status-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
              .status-box .icon { font-size: 32px; }
              .status-box .text { color: #155724; font-weight: bold; }
              .booking-card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
              .booking-card h3 { margin: 0 0 15px; color: #C9A351; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #666; }
              .detail-value { font-weight: bold; }
              .price-box { background: linear-gradient(135deg, #C9A351, #E5C778); color: white; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .price-box .amount { font-size: 32px; font-weight: bold; }
              .price-box .label { opacity: 0.9; }
              .info-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .info-box h4 { margin: 0 0 10px; color: #0066cc; }
              .contact-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
              .contact-box a { color: #C9A351; text-decoration: none; font-weight: bold; }
              .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
              .footer a { color: #C9A351; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>MVA Imobiliare</h1>
                <p>Regim Hotelier</p>
              </div>
              
              <div class="content">
                <div class="greeting">
                  Bună ziua, <strong>${guestName}</strong>! 👋
                </div>

                <div class="status-box">
                  <div class="icon">📩</div>
                  <div class="text">Cererea dvs. de rezervare a fost primită!</div>
                </div>

                <p>Vă mulțumim pentru interesul acordat. Am primit cererea dvs. de rezervare și o vom procesa în cel mai scurt timp.</p>
                <p><strong>Vă vom contacta în curând pentru confirmare.</strong></p>

                <div class="booking-card">
                  <h3>📍 ${propertyTitle}</h3>
                  ${propertyLocation ? `<p style="color: #666; margin: 0;">${propertyLocation}</p>` : ''}
                </div>

                <div class="booking-card">
                  <h3>📅 Detalii Rezervare</h3>
                  <div class="detail-row">
                    <span class="detail-label">Check-in:</span>
                    <span class="detail-value">${formatDate(checkIn)} • ${checkInTime}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Check-out:</span>
                    <span class="detail-value">${formatDate(checkOut)} • ${checkOutTime}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Durată:</span>
                    <span class="detail-value">${nights} ${nights === 1 ? 'noapte' : 'nopți'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Număr oaspeți:</span>
                    <span class="detail-value">${numGuests} ${numGuests === 1 ? 'persoană' : 'persoane'}</span>
                  </div>
                </div>

                <div class="price-box">
                  <div class="label">Preț Total Estimat</div>
                  <div class="amount">${totalPrice.toLocaleString()} ${currency}</div>
                </div>

                <div class="info-box">
                  <h4>ℹ️ Ce urmează?</h4>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>Vom verifica disponibilitatea pentru perioada selectată</li>
                    <li>Vă vom contacta telefonic pentru confirmare</li>
                    <li>Veți primi instrucțiuni detaliate pentru check-in</li>
                  </ul>
                </div>

                <div class="contact-box">
                  <p style="margin: 0 0 10px;">Aveți întrebări? Suntem aici să vă ajutăm!</p>
                  <p style="margin: 0;">
                    📞 <a href="tel:+40723229282">+40 723 229 282</a><br>
                    ✉️ <a href="mailto:contact@mvaimobiliare.ro">contact@mvaimobiliare.ro</a>
                  </p>
                </div>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} MVA Imobiliare. Toate drepturile rezervate.</p>
                <p><a href="https://mvaimobiliare.ro">www.mvaimobiliare.ro</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log("Guest confirmation email sent:", guestEmailResponse);
    }

    return new Response(JSON.stringify({ success: true }), {
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
