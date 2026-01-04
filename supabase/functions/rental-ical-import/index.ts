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
    const { rental_id, ical_url, source_name } = await req.json();

    if (!rental_id || !ical_url) {
      return new Response(
        JSON.stringify({ error: "Missing rental_id or ical_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Importing iCal for rental ${rental_id} from ${ical_url}`);

    // Fetch iCal content
    const icalResponse = await fetch(ical_url, {
      headers: {
        "User-Agent": "MVA Real Estate Calendar Sync/1.0",
      },
    });

    if (!icalResponse.ok) {
      throw new Error(`Failed to fetch iCal: ${icalResponse.status}`);
    }

    const icalContent = await icalResponse.text();
    console.log(`Fetched iCal content: ${icalContent.length} bytes`);

    // Parse iCal events
    const events = parseICal(icalContent);
    console.log(`Parsed ${events.length} events`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process events and update availability
    let imported = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const event of events) {
      if (!event.startDate || !event.endDate) continue;
      
      // Skip past events
      if (event.endDate < today) continue;

      // Generate dates between start and end (exclusive of end date in iCal)
      const dates = getDatesBetween(event.startDate, event.endDate);

      for (const date of dates) {
        const dateStr = date.toISOString().split("T")[0];
        
        const { error } = await supabase
          .from("rental_availability")
          .upsert(
            {
              rental_id,
              date: dateStr,
              is_available: false,
              guest_name: event.summary || null,
              notes: `Import din ${source_name || "iCal"}: ${event.summary || "Rezervare externă"}`,
            },
            { onConflict: "rental_id,date" }
          );

        if (error) {
          console.error(`Error upserting date ${dateStr}:`, error);
        } else {
          imported++;
        }
      }
    }

    console.log(`Successfully imported ${imported} blocked dates`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events_found: events.length,
        dates_imported: imported 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error importing iCal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ICalEvent {
  uid: string;
  summary: string;
  startDate: Date | null;
  endDate: Date | null;
}

function parseICal(content: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = content.split(/\r?\n/);
  
  let currentEvent: Partial<ICalEvent> | null = null;
  let unfoldedLine = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle line unfolding (lines starting with space or tab are continuations)
    if (line.startsWith(" ") || line.startsWith("\t")) {
      unfoldedLine += line.substring(1);
      continue;
    } else {
      if (unfoldedLine) {
        processLine(unfoldedLine, currentEvent);
      }
      unfoldedLine = line;
    }

    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
    } else if (line === "END:VEVENT" && currentEvent) {
      if (currentEvent.startDate) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = null;
    }
  }

  // Process last line
  if (unfoldedLine && currentEvent) {
    processLine(unfoldedLine, currentEvent);
  }

  return events;
}

function processLine(line: string, event: Partial<ICalEvent> | null) {
  if (!event) return;

  if (line.startsWith("UID:")) {
    event.uid = line.substring(4);
  } else if (line.startsWith("SUMMARY:")) {
    event.summary = unescapeICalText(line.substring(8));
  } else if (line.startsWith("DTSTART")) {
    event.startDate = parseICalDate(line);
  } else if (line.startsWith("DTEND")) {
    event.endDate = parseICalDate(line);
  }
}

function parseICalDate(line: string): Date | null {
  // Handle both DTSTART:20240101 and DTSTART;VALUE=DATE:20240101 formats
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return null;

  const dateStr = line.substring(colonIndex + 1).trim();
  
  // Check if it's a date-only format (8 chars: YYYYMMDD)
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
  
  // Handle datetime format (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
  if (dateStr.length >= 15) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));
    
    if (dateStr.endsWith("Z")) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    return new Date(year, month, day, hour, minute, second);
  }

  return null;
}

function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}
