import { supabase } from "@/integrations/supabase/client";
import { generatePropertySlug } from "@/lib/propertySlug";

const SITE = "https://www.mvaimobiliare.ro";
const PHONE_LINE = "☎️ 0767.941.512";

type OfferLike = {
  id: string;
  slug?: string | null;
  title?: string | null;
  zone?: string | null;
  project_name?: string | null;
  location?: string | null;
  city?: string | null;
  surface_min?: number | null;
  surface_max?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  balconies?: number | null;
  floor?: number | null;
  floor_label?: string | null;
  total_floors?: number | null;
  year_built?: number | null;
  compartment?: string | null;
  comfort?: string | null;
  build_materials?: string | null;
  furnished?: string | null;
  property_type?: string | null;
  building_type?: string | null;
  transaction_type?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  price_type?: string | null;
  features?: string[] | null;
  amenities?: string[] | null;
  has_ac?: boolean | null;
  has_electricity?: boolean | null;
  has_gas?: boolean | null;
  has_internet?: boolean | null;
  has_phone?: boolean | null;
  has_security?: boolean | null;
  has_tv?: boolean | null;
  has_water?: boolean | null;
  has_wood_floors?: boolean | null;
};

// Reuse the exact mapping from PropertyDetail.tsx
const mapFurnished = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const codeMap: Record<string, string> = {
    "30301": "Nemobilat",
    "30302": "Parțial mobilat",
    "30303": "Mobilat",
    "30304": "Mobilat",
  };
  const rawStr = String(raw).trim();
  if (!rawStr) return null;
  if (codeMap[rawStr]) return codeMap[rawStr];
  const lower = rawStr.toLowerCase();
  if (/nemobilat/.test(lower)) return "Nemobilat";
  if (/parțial|partial/.test(lower)) return "Parțial mobilat";
  if (/mobilat/.test(lower)) return "Mobilat";
  const found = Object.entries(codeMap).find(([c]) => lower.includes(c))?.[1];
  if (found) return found;
  // Skip raw unmapped numeric codes
  if (/^\d+$/.test(rawStr)) return null;
  return rawStr;
};

// Skip raw numeric CRM codes when no mapping exists
const cleanLabel = (raw: string | null | undefined): string | null => {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return null;
  return s;
};

const formatFloor = (o: OfferLike): string | null => {
  if (o.floor_label && String(o.floor_label).trim()) {
    const label = String(o.floor_label).trim();
    if (o.total_floors) return `${label} / ${o.total_floors}`;
    return label;
  }
  if (o.floor === 0) return o.total_floors ? `Parter / ${o.total_floors}` : "Parter";
  if (typeof o.floor === "number" && o.floor > 0) {
    return o.total_floors ? `${o.floor} / ${o.total_floors}` : `${o.floor}`;
  }
  return null;
};

const formatRoLocaleNumber = (n: number, decimals = 0): string => {
  return n.toLocaleString("ro-RO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const collectUtilities = (o: OfferLike): string[] => {
  const list: string[] = [];
  if (o.has_gas) list.push("Gaz");
  if (o.has_water) list.push("Apă");
  if (o.has_electricity) list.push("Curent");
  if (o.has_ac) list.push("Aer condiționat");
  if (o.has_internet) list.push("Internet");
  if (o.has_tv) list.push("TV cablu");
  if (o.has_phone) list.push("Telefon");
  if (o.has_security) list.push("Sistem securitate");
  if (o.has_wood_floors) list.push("Parchet");
  return list;
};

const collectFinishes = (o: OfferLike): string[] => {
  const set = new Set<string>();
  (o.features || []).forEach((f) => {
    const c = cleanLabel(f);
    if (c) set.add(c);
  });
  (o.amenities || []).forEach((a) => {
    const c = cleanLabel(a);
    if (c) set.add(c);
  });
  return Array.from(set);
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
  const lines: string[] = [];

  const title = (o.title || "").trim();
  if (title) lines.push(`🏠 ${title}`);

  const price = o.price_min ?? o.price_max;
  const surface = o.surface_min ?? o.surface_max;
  if (price && Number(price) > 0) {
    lines.push(`💶 ${formatRoLocaleNumber(Number(price))} EUR`);
  }

  if (o.rooms && Number(o.rooms) > 0) lines.push(`🛏️ Camere: ${o.rooms}`);
  if (o.bathrooms && Number(o.bathrooms) > 0) lines.push(`🛁 Băi: ${o.bathrooms}`);
  if (surface && Number(surface) > 0) lines.push(`📐 Suprafață utilă: ${surface} mp`);

  const floor = formatFloor(o);
  if (floor) lines.push(`🏢 Etaj: ${floor}`);

  if (o.total_floors && Number(o.total_floors) > 0) {
    lines.push(`🏗️ Nr. nivele: ${o.total_floors}`);
  }
  if (o.balconies && Number(o.balconies) > 0) lines.push(`🌇 Balcoane: ${o.balconies}`);
  if (o.year_built && Number(o.year_built) > 0) lines.push(`📅 An construcție: ${o.year_built}`);

  const layout = cleanLabel(o.compartment);
  if (layout) lines.push(`🧭 Compartimentare: ${layout}`);

  const comfort = cleanLabel(o.comfort);
  if (comfort) lines.push(`✨ Confort: ${comfort}`);

  const structure = cleanLabel(o.build_materials);
  if (structure) lines.push(`🧱 Structură: ${structure}`);

  const furnished = mapFurnished(o.furnished);
  if (furnished) lines.push(`🛋️ Mobilat: ${furnished}`);

  const zone = cleanLabel(o.zone);
  if (zone) lines.push(`📍 Zonă: ${zone}`);

  const city = cleanLabel(o.city);
  if (city) lines.push(`🏙️ Oraș: ${city}`);

  const loc = cleanLabel(o.location);
  if (loc) lines.push(`🗺️ Locație: ${loc}`);

  if (o.transaction_type) {
    const tt = String(o.transaction_type).toLowerCase();
    if (tt === "rent" || /închiri|inchiri/.test(tt)) {
      lines.push("🤝 Tip tranzacție: Închiriere");
    } else if (tt === "sale" || /vânzare|vanzare/.test(tt)) {
      lines.push("🏷️ Tip tranzacție: Vânzare");
    }
  }

  const utilities = collectUtilities(o);
  if (utilities.length) lines.push(`🔌 Utilități: ${utilities.join(" • ")}`);

  const finishes = collectFinishes(o);
  if (finishes.length) lines.push(`🎨 Finisaje: ${finishes.join(" • ")}`);

  lines.push(PHONE_LINE);
  lines.push(`🔗 Detalii: ${resolveOfferUrl(o)}`);

  return lines.join("\n");
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
