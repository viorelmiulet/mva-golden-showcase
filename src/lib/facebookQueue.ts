import { supabase } from "@/integrations/supabase/client";
import { generatePropertySlug } from "@/lib/propertySlug";

const SITE = "https://www.mvaimobiliare.ro";
const PHONE_LINE = "☎️ 0767.941.512 – MVA Imobiliare";

type OfferLike = {
  id: string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  zone?: string | null;
  project_name?: string | null;
  location?: string | null;
  surface_min?: number | null;
  surface_max?: number | null;
  rooms?: number | null;
  floor?: number | null;
  floor_label?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  price_type?: string | null;
  property_type?: string | null;
  building_type?: string | null;
  city?: string | null;
};

const pickEmoji = (o: OfferLike): string => {
  const bag = `${o.property_type || ""} ${o.building_type || ""} ${o.title || ""}`.toLowerCase();
  if (/\b(casa|casă|vila|vilă|duplex|townhouse)\b/.test(bag)) return "🏠";
  return "🏢";
};

const pickLocation = (o: OfferLike): string => {
  return (o.zone || o.project_name || o.location || o.city || "").toString().trim();
};

const pickSurface = (o: OfferLike): number | null => {
  const s = o.surface_min ?? o.surface_max;
  return s && Number(s) > 0 ? Number(s) : null;
};

const pickFloor = (o: OfferLike): string => {
  if (o.floor_label && String(o.floor_label).trim()) return String(o.floor_label).trim();
  if (o.floor === 0) return "Parter";
  if (typeof o.floor === "number" && o.floor > 0) return `Etaj ${o.floor}`;
  return "";
};

const pickPrice = (o: OfferLike): number | null => {
  const p = o.price_min ?? o.price_max;
  return p && Number(p) > 0 ? Number(p) : null;
};

const hasVat = (o: OfferLike): boolean => {
  return !!o.price_type && /tva/i.test(o.price_type);
};

const truncateAtWord = (text: string, max = 200): string => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:\-–—.]+$/, "");
};

export const resolveOfferUrl = (o: OfferLike): string => {
  const slug = o.slug && o.slug.trim()
    ? o.slug.trim()
    : generatePropertySlug({
        id: o.id,
        rooms: o.rooms ?? null,
        project_name: o.project_name ?? null,
        zone: o.zone ?? null,
        location: o.location ?? null,
        surface_min: o.surface_min ?? null,
        floor: o.floor ?? null,
        city: o.city ?? null,
      });
  return `${SITE}/proprietate/${slug}`;
};

export const buildFacebookMessage = (o: OfferLike): string => {
  const emoji = pickEmoji(o);
  const title = (o.title || "").trim();
  const loc = pickLocation(o);
  const surface = pickSurface(o);
  const rooms = o.rooms && Number(o.rooms) > 0 ? Number(o.rooms) : null;
  const floor = pickFloor(o);
  const price = pickPrice(o);
  const url = resolveOfferUrl(o);

  const lines: string[] = [];
  if (title) lines.push(`${emoji} ${title}`);
  if (loc) lines.push(`📍 ${loc}`);

  const specBits: string[] = [];
  if (surface) specBits.push(`${surface} mp utili`);
  if (rooms) specBits.push(rooms === 1 ? "1 cameră" : `${rooms} camere`);
  if (floor) specBits.push(floor);
  if (specBits.length) lines.push(`📐 ${specBits.join(" · ")}`);

  if (price) {
    lines.push(`💰 ${price.toLocaleString("ro-RO")} EUR${hasVat(o) ? " + TVA" : ""}`);
  }

  if (o.description && o.description.trim()) {
    lines.push(`${truncateAtWord(o.description, 200)}...`);
  }

  lines.push(`Detalii complete și poze: ${url}`);
  lines.push(PHONE_LINE);

  return lines.join("\n\n");
};

export type EnqueueResult = {
  offerId: string;
  offerTitle: string;
  status: "queued" | "duplicate" | "error";
  error?: string;
};

export const enqueueOfferToFacebook = async (o: OfferLike): Promise<EnqueueResult> => {
  const offerTitle = (o.title || "").trim() || "Fără titlu";
  try {
    const { data: existing, error: selErr } = await supabase
      .from("fb_post_queue")
      .select("id, status")
      .eq("offer_id", o.id)
      .in("status", ["pending", "posting"])
      .limit(1);
    if (selErr) throw selErr;
    if (existing && existing.length > 0) {
      return { offerId: o.id, offerTitle, status: "duplicate" };
    }

    const payload = {
      offer_id: o.id,
      message: buildFacebookMessage(o),
      offer_url: resolveOfferUrl(o),
      status: "pending" as const,
    };
    const { error: insErr } = await supabase.from("fb_post_queue").insert(payload);
    if (insErr) throw insErr;
    return { offerId: o.id, offerTitle, status: "queued" };
  } catch (err: any) {
    return { offerId: o.id, offerTitle, status: "error", error: err?.message || String(err) };
  }
};
