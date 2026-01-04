import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const rentalId = url.searchParams.get("rental_id");

    if (!rentalId) {
      return new Response("Missing rental_id parameter", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch rental info
    const { data: rental, error: rentalError } = await supabase
      .from("short_term_rentals")
      .select("id, title, location, address")
      .eq("id", rentalId)
      .maybeSingle();

    if (rentalError || !rental) {
      console.error("Rental fetch error:", rentalError);
      return new Response("Rental not found", { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Fetch bookings for the next 365 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { data: bookings, error: bookingsError } = await supabase
      .from("rental_bookings")
      .select("id, check_in, check_out, guest_name, status")
      .eq("rental_id", rentalId)
      .neq("status", "cancelled")
      .gte("check_out", startDate.toISOString().split("T")[0])
      .lte("check_in", endDate.toISOString().split("T")[0]);

    if (bookingsError) {
      console.error("Bookings fetch error:", bookingsError);
    }

    // Fetch blocked dates from availability
    const { data: blockedDates, error: blockedError } = await supabase
      .from("rental_availability")
      .select("date, guest_name, notes")
      .eq("rental_id", rentalId)
      .eq("is_available", false)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0]);

    if (blockedError) {
      console.error("Blocked dates fetch error:", blockedError);
    }

    // Generate iCal content
    const icalContent = generateICal(rental, bookings || [], blockedDates || []);

    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${rental.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics"`,
      },
    });
  } catch (error) {
    console.error("Error generating iCal:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateICal(
  rental: { id: string; title: string; location: string; address: string },
  bookings: { id: string; check_in: string; check_out: string; guest_name: string; status: string }[],
  blockedDates: { date: string; guest_name: string | null; notes: string | null }[]
) {
  const now = new Date();
  const timestamp = formatICalDate(now);

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MVA Real Estate//Rental Calendar//RO
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeICalText(rental.title)}
X-WR-TIMEZONE:Europe/Bucharest
`;

  // Add bookings as events
  for (const booking of bookings) {
    const uid = `booking-${booking.id}@mva-realestate.ro`;
    const dtstart = formatICalDateOnly(new Date(booking.check_in));
    const dtend = formatICalDateOnly(new Date(booking.check_out));
    const summary = booking.guest_name ? `Rezervare: ${booking.guest_name}` : "Rezervare";

    ical += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${escapeICalText(summary)}
DESCRIPTION:Status: ${booking.status}
LOCATION:${escapeICalText(rental.address || rental.location || "")}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
  }

  // Group consecutive blocked dates into events
  const sortedBlocked = [...blockedDates].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let blockStart: Date | null = null;
  let blockEnd: Date | null = null;
  let blockNotes: string | null = null;
  let blockIndex = 0;

  const addBlockedEvent = () => {
    if (blockStart && blockEnd) {
      blockIndex++;
      const uid = `blocked-${rental.id}-${blockIndex}@mva-realestate.ro`;
      const endDate = new Date(blockEnd);
      endDate.setDate(endDate.getDate() + 1); // iCal DTEND is exclusive
      
      ical += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${formatICalDateOnly(blockStart)}
DTEND;VALUE=DATE:${formatICalDateOnly(endDate)}
SUMMARY:Indisponibil
DESCRIPTION:${escapeICalText(blockNotes || "Proprietate blocată")}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
    }
  };

  for (const blocked of sortedBlocked) {
    const currentDate = new Date(blocked.date);
    
    if (!blockStart) {
      blockStart = currentDate;
      blockEnd = currentDate;
      blockNotes = blocked.notes;
    } else {
      const expectedNext = new Date(blockEnd!);
      expectedNext.setDate(expectedNext.getDate() + 1);
      
      if (currentDate.getTime() === expectedNext.getTime()) {
        blockEnd = currentDate;
      } else {
        addBlockedEvent();
        blockStart = currentDate;
        blockEnd = currentDate;
        blockNotes = blocked.notes;
      }
    }
  }
  addBlockedEvent();

  ical += "END:VCALENDAR";
  return ical;
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatICalDateOnly(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
