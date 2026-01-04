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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active iCal sources that need syncing
    const { data: sources, error: sourcesError } = await supabase
      .from("rental_ical_sources")
      .select("*")
      .eq("is_active", true);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    console.log(`Found ${sources?.length || 0} active iCal sources`);

    const results: Array<{ source_id: string; success: boolean; error?: string; dates_imported?: number }> = [];

    for (const source of sources || []) {
      // Check if sync is needed based on interval
      const lastSync = source.last_sync_at ? new Date(source.last_sync_at) : null;
      const hoursAgo = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) : Infinity;

      if (hoursAgo < (source.sync_interval_hours || 6)) {
        console.log(`Skipping source ${source.id} - synced ${hoursAgo.toFixed(1)} hours ago`);
        continue;
      }

      console.log(`Syncing source ${source.id} (${source.source_name}) for rental ${source.rental_id}`);

      try {
        // Fetch iCal content
        const icalResponse = await fetch(source.ical_url, {
          headers: { "User-Agent": "MVA Real Estate Calendar Sync/1.0" },
        });

        if (!icalResponse.ok) {
          throw new Error(`HTTP ${icalResponse.status}`);
        }

        const icalContent = await icalResponse.text();
        const events = parseICal(icalContent);
        console.log(`Parsed ${events.length} events from ${source.source_name}`);

        // Process events
        let imported = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const event of events) {
          if (!event.startDate || !event.endDate) continue;
          if (event.endDate < today) continue;

          const dates = getDatesBetween(event.startDate, event.endDate);

          for (const date of dates) {
            const dateStr = date.toISOString().split("T")[0];

            const { error } = await supabase
              .from("rental_availability")
              .upsert(
                {
                  rental_id: source.rental_id,
                  date: dateStr,
                  is_available: false,
                  guest_name: event.summary || null,
                  notes: `Sync automat din ${source.source_name}: ${event.summary || "Rezervare externă"}`,
                },
                { onConflict: "rental_id,date" }
              );

            if (!error) imported++;
          }
        }

        // Update source with success status
        await supabase
          .from("rental_ical_sources")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "success",
            last_sync_error: null,
          })
          .eq("id", source.id);

        results.push({ source_id: source.id, success: true, dates_imported: imported });
        console.log(`Successfully synced ${imported} dates from ${source.source_name}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing source ${source.id}:`, errorMessage);

        // Update source with error status
        await supabase
          .from("rental_ical_sources")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "error",
            last_sync_error: errorMessage,
          })
          .eq("id", source.id);

        results.push({ source_id: source.id, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in iCal sync:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
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
    const line = lines[i];

    if (line.startsWith(" ") || line.startsWith("\t")) {
      unfoldedLine += line.substring(1);
      continue;
    } else {
      if (unfoldedLine && currentEvent) {
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

  if (unfoldedLine && currentEvent) {
    processLine(unfoldedLine, currentEvent);
  }

  return events;
}

function processLine(line: string, event: Partial<ICalEvent>) {
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
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return null;

  const dateStr = line.substring(colonIndex + 1).trim();

  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

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
