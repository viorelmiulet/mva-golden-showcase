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
  if (/^\d+$/.test(rawStr)) return null;
  return rawStr;
};

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
  const headerLines: string[] = [];
  const title = (o.title || "").trim();
  if (title) headerLines.push(`🏠 ${title}`);

  const detailLines: string[] = [];
  const price = o.price_min ?? o.price_max;
  const surface = o.surface_min ?? o.surface_max;
  if (price && Number(price) > 0) {
    detailLines.push(`💶 ${formatRoLocaleNumber(Number(price))} EUR`);
  }
  if (o.rooms && Number(o.rooms) > 0) detailLines.push(`🛏️ Camere: ${o.rooms}`);
  if (o.bathrooms && Number(o.bathrooms) > 0) detailLines.push(`🛁 Băi: ${o.bathrooms}`);
  if (surface && Number(surface) > 0) detailLines.push(`📐 Suprafață utilă: ${surface} mp`);

  const floor = formatFloor(o);
  if (floor) detailLines.push(`🏢 Etaj: ${floor}`);

  if (o.total_floors && Number(o.total_floors) > 0) {
    detailLines.push(`🗂️ Nr. nivele: ${o.total_floors}`);
  }
  if (o.balconies && Number(o.balconies) > 0) detailLines.push(`🗂️ Balcoane: ${o.balconies}`);
  if (o.year_built && Number(o.year_built) > 0) detailLines.push(`🏗️ An construcție: ${o.year_built}`);

  const layout = cleanLabel(o.compartment);
  if (layout) detailLines.push(`🗂️ Compartimentare: ${layout}`);

  const comfort = cleanLabel(o.comfort);
  if (comfort) detailLines.push(`🏠 Confort: ${comfort}`);

  const structure = cleanLabel(o.build_materials);
  if (structure) detailLines.push(`🧱 Structură: ${structure}`);

  const furnished = mapFurnished(o.furnished);
  if (furnished) detailLines.push(`🛋️ Mobilat: ${furnished}`);

  const zone = cleanLabel(o.zone);
  if (zone) detailLines.push(`📍 Zonă: ${zone}`);


  if (o.transaction_type) {
    const tt = String(o.transaction_type).toLowerCase();
    if (tt === "rent" || /închiri|inchiri/.test(tt)) {
      detailLines.push("🤝 Tip tranzacție: Închiriere");
    } else if (tt === "sale" || /vânzare|vanzare/.test(tt)) {
      detailLines.push("🏷️ Tip tranzacție: Vânzare");
    }
  }

  const utilities = collectUtilities(o);
  if (utilities.length) detailLines.push(`🔌 Utilități: ${utilities.join(" • ")}`);

  const finishes = collectFinishes(o);
  if (finishes.length) detailLines.push(`🎨 Finisaje: ${finishes.join(" • ")}`);

  const contactLines = [PHONE_LINE, "🌐 mvaimobiliare.ro"];
  const urlLines = [`🔗 Detalii: ${resolveOfferUrl(o)}`];

  // Blocks separated by blank lines, matching generatePropertyContent from
  // supabase/functions/social-auto-post/index.ts (MVA page publisher).
  return [headerLines, detailLines, contactLines, urlLines]
    .filter((block) => block.length > 0)
    .map((block) => block.join("\n"))
    .join("\n\n");
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

const OFFER_FIELDS =
  "id, slug, title, zone, project_name, location, city, surface_min, surface_max, rooms, bathrooms, balconies, floor, floor_label, total_floors, year_built, compartment, comfort, build_materials, furnished, property_type, building_type, transaction_type, price_min, price_max, price_type, features, amenities, has_ac, has_electricity, has_gas, has_internet, has_phone, has_security, has_tv, has_water, has_wood_floors";

export type RegenerateResult = {
  scanned: number;
  updated: number;
  skipped: number;
  errors: { id: string; error: string }[];
};

/**
 * Rebuilds `message` and `offer_url` for every queue row still eligible for
 * publishing (status = pending or error), using the current buildFacebookMessage
 * template. Ensures old queued content never reaches Facebook after the template
 * changes (e.g. removed fields like Oraș / Locație).
 */
export const regenerateQueuedMessages = async (
  statuses: Array<"pending" | "posting" | "done" | "error"> = ["pending", "error"],
): Promise<RegenerateResult> => {
  const result: RegenerateResult = { scanned: 0, updated: 0, skipped: 0, errors: [] };

  const { data: rows, error } = await supabase
    .from("fb_post_queue")
    .select("id, offer_id, message")
    .in("status", statuses);
  if (error) throw error;

  result.scanned = rows?.length || 0;
  if (!rows || rows.length === 0) return result;

  const offerIds = Array.from(new Set(rows.map((r) => r.offer_id).filter(Boolean)));
  const { data: offers, error: offErr } = await supabase
    .from("catalog_offers")
    .select(OFFER_FIELDS)
    .in("id", offerIds);
  if (offErr) throw offErr;

  const byId = new Map<string, OfferLike>();
  (offers || []).forEach((o: any) => byId.set(o.id, o as OfferLike));

  for (const row of rows) {
    const offer = byId.get(row.offer_id);
    if (!offer) {
      result.skipped += 1;
      continue;
    }
    const newMessage = buildFacebookMessage(offer);
    const newUrl = resolveOfferUrl(offer);
    if (newMessage === row.message) {
      result.skipped += 1;
      continue;
    }
    const { error: upErr } = await supabase
      .from("fb_post_queue")
      .update({ message: newMessage, offer_url: newUrl })
      .eq("id", row.id);
    if (upErr) {
      result.errors.push({ id: row.id, error: upErr.message });
    } else {
      result.updated += 1;
    }
  }

  return result;
};
