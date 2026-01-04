import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date and calculate reminder dates (1-2 days before check-in)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterStr = dayAfterTomorrow.toISOString().split('T')[0];

    console.log(`Checking bookings for check-in on ${tomorrowStr} or ${dayAfterStr}`);

    // Get bookings with check-in in 1-2 days that haven't received a reminder
    const { data: bookings, error: bookingsError } = await supabase
      .from("rental_bookings")
      .select(`
        id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        num_guests,
        total_price,
        currency,
        status,
        rental_id
      `)
      .in("check_in", [tomorrowStr, dayAfterStr])
      .is("reminder_sent_at", null)
      .neq("status", "cancelled")
      .not("guest_email", "is", null);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw bookingsError;
    }

    console.log(`Found ${bookings?.length || 0} bookings needing reminders`);

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No reminders to send",
        count: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get rental details for each booking
    const rentalIds = [...new Set(bookings.map(b => b.rental_id))];
    const { data: rentals, error: rentalsError } = await supabase
      .from("short_term_rentals")
      .select("id, title, location, address, check_in_time, check_out_time, contact_phone, contact_email")
      .in("id", rentalIds);

    if (rentalsError) {
      console.error("Error fetching rentals:", rentalsError);
      throw rentalsError;
    }

    const rentalsMap = new Map(rentals?.map(r => [r.id, r]) || []);
    const sentReminders: string[] = [];
    const errors: string[] = [];

    for (const booking of bookings) {
      const rental = rentalsMap.get(booking.rental_id);
      if (!rental || !booking.guest_email) continue;

      const checkInDate = new Date(booking.check_in);
      const checkOutDate = new Date(booking.check_out);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      try {
        await resend.emails.send({
          from: "MVA Imobiliare <noreply@mvaimobiliare.ro>",
          to: [booking.guest_email],
          subject: `⏰ Reminder: Check-in în ${daysUntilCheckIn} ${daysUntilCheckIn === 1 ? 'zi' : 'zile'} - ${rental.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #C9A351, #E5C778); padding: 30px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .countdown { background: #fff; padding: 20px; text-align: center; border-bottom: 3px solid #C9A351; }
                .countdown .number { font-size: 48px; font-weight: bold; color: #C9A351; }
                .countdown .text { color: #666; }
                .content { padding: 30px 20px; background: #fff; }
                .property-card { background: linear-gradient(135deg, #f8f9fa, #fff); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e9ecef; }
                .property-card h2 { margin: 0 0 10px; color: #333; }
                .property-card .location { color: #666; display: flex; align-items: center; gap: 5px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                .detail-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                .detail-box .label { font-size: 12px; color: #666; text-transform: uppercase; }
                .detail-box .value { font-size: 18px; font-weight: bold; color: #333; margin-top: 5px; }
                .checkin-info { background: #d4edda; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .checkin-info h3 { color: #155724; margin: 0 0 15px; }
                .checkin-info .time { font-size: 24px; font-weight: bold; color: #155724; }
                .address-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                .address-box h4 { margin: 0 0 10px; color: #0066cc; }
                .checklist { background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .checklist h4 { margin: 0 0 15px; color: #856404; }
                .checklist ul { margin: 0; padding-left: 20px; }
                .checklist li { margin-bottom: 8px; }
                .contact-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                .contact-box a { color: #C9A351; text-decoration: none; font-weight: bold; }
                .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
                .footer a { color: #C9A351; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Reminder Check-in</h1>
                </div>
                
                <div class="countdown">
                  <div class="number">${daysUntilCheckIn}</div>
                  <div class="text">${daysUntilCheckIn === 1 ? 'zi până la check-in' : 'zile până la check-in'}</div>
                </div>

                <div class="content">
                  <p>Bună ziua, <strong>${booking.guest_name}</strong>!</p>
                  <p>Vă reamintim că rezervarea dvs. se apropie. Abia așteptăm să vă întâmpinăm!</p>

                  <div class="property-card">
                    <h2>📍 ${rental.title}</h2>
                    ${rental.location ? `<p class="location">📌 ${rental.location}</p>` : ''}
                  </div>

                  <div class="details-grid">
                    <div class="detail-box">
                      <div class="label">Check-in</div>
                      <div class="value">${formatDate(booking.check_in)}</div>
                    </div>
                    <div class="detail-box">
                      <div class="label">Check-out</div>
                      <div class="value">${formatDate(booking.check_out)}</div>
                    </div>
                    <div class="detail-box">
                      <div class="label">Nopți</div>
                      <div class="value">${nights}</div>
                    </div>
                    <div class="detail-box">
                      <div class="label">Oaspeți</div>
                      <div class="value">${booking.num_guests}</div>
                    </div>
                  </div>

                  <div class="checkin-info">
                    <h3>🕐 Ora de Check-in</h3>
                    <div class="time">${rental.check_in_time || '14:00'}</div>
                    <p style="margin: 10px 0 0; color: #155724;">Check-out până la: ${rental.check_out_time || '11:00'}</p>
                  </div>

                  ${rental.address ? `
                  <div class="address-box">
                    <h4>📍 Adresa</h4>
                    <p style="margin: 0;">${rental.address}</p>
                  </div>
                  ` : ''}

                  <div class="checklist">
                    <h4>✅ Înainte de a pleca:</h4>
                    <ul>
                      <li>Verificați actul de identitate (CI/pașaport)</li>
                      <li>Salvați numărul nostru de contact</li>
                      <li>Confirmați ora estimată de sosire</li>
                      <li>Pregătiți modalitatea de plată (dacă este cazul)</li>
                    </ul>
                  </div>

                  <div class="contact-box">
                    <p style="margin: 0 0 10px;">Aveți întrebări sau doriți să modificați rezervarea?</p>
                    <p style="margin: 0;">
                      📞 <a href="tel:+40723229282">+40 723 229 282</a><br>
                      ✉️ <a href="mailto:contact@mvaimobiliare.ro">contact@mvaimobiliare.ro</a>
                    </p>
                  </div>

                  <p style="text-align: center; color: #666;">Vă mulțumim că ați ales MVA Imobiliare! 🏠</p>
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

        // Update booking to mark reminder as sent
        await supabase
          .from("rental_bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        sentReminders.push(booking.id);
        console.log(`Reminder sent for booking ${booking.id} to ${booking.guest_email}`);
      } catch (emailError: any) {
        console.error(`Error sending reminder for booking ${booking.id}:`, emailError);
        errors.push(`${booking.id}: ${emailError.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sent ${sentReminders.length} reminders`,
      sentReminders,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-reminders function:", error);
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
