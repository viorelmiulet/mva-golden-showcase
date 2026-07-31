/**
 * Server-only implementation of the internal admin edge functions (wave 2).
 * Ports: admin-offers, admin-complexes, api-keys-manager,
 *        update-floor-plan, update-project-image, fix-property-zones.
 *
 * Behaviour (actions, payloads, response shapes) is kept identical to the
 * original Supabase Edge Functions so existing call sites keep working.
 */

type AnyRecord = Record<string, unknown>;
type Result = AnyRecord;

/** Loosely typed service-role client (generic table names + tables missing from generated types). */
async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (table: string) => any;
    rpc: (name: string, args?: AnyRecord) => any;
    storage: {
      from: (bucket: string) => any;
    };
  };
}

const fail = (error: string): Result => ({ success: false, error });

/* ------------------------------------------------------------------ */
/* admin-offers                                                        */
/* ------------------------------------------------------------------ */

export async function adminOffers(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const action = body?.action as string | undefined;

  if (action === "insert_offer") {
    const offer = body?.offer as AnyRecord | undefined;
    if (!offer) return fail("Missing required field: offer");

    const required = ["title", "description", "location", "price_min", "price_max", "rooms"];
    const missing = required.filter(
      (k) =>
        offer[k] === undefined ||
        offer[k] === null ||
        (typeof offer[k] === "string" && String(offer[k]).trim() === ""),
    );
    if (missing.length > 0) return fail(`Missing required offer fields: ${missing.join(", ")}`);

    offer.currency = "EUR";
    if (!("availability_status" in offer)) offer.availability_status = "available";
    if (!("source" in offer)) offer.source = "manual";
    if (!("images" in offer)) offer.images = [];
    if (!("features" in offer)) offer.features = [];
    if (!("amenities" in offer)) offer.amenities = [];
    if (!("is_published" in offer)) offer.is_published = true;

    const { data, error } = await supabase
      .from("catalog_offers")
      .insert(offer)
      .select("id")
      .maybeSingle();
    if (error) return fail(error.message);
    return { success: true, message: "Offer inserted successfully", id: data?.id };
  }

  if (action === "delete_offer") {
    const id = body?.id as string | undefined;
    if (!id) return fail("Missing required field: id");
    const { error } = await supabase.from("catalog_offers").delete().eq("id", id);
    if (error) return fail(error.message);
    return { success: true, message: "Offer deleted successfully", id };
  }

  if (action === "update_offer") {
    const id = body?.id as string | undefined;
    const data = body?.data as AnyRecord | undefined;
    if (!id || !data) return fail("Missing required fields: id, data");
    if ("currency" in data) data.currency = "EUR";
    const { error } = await supabase.from("catalog_offers").update(data).eq("id", id);
    if (error) return fail(error.message);
    return { success: true, message: "Offer updated successfully", id };
  }

  if (action === "update_status") {
    const id = body?.id as string | undefined;
    const status = body?.availability_status as string | undefined;
    if (!id || !status) return fail("Missing required fields: id, availability_status");
    if (!["available", "reserved", "sold"].includes(status)) {
      return fail("Invalid availability_status. Use available | reserved | sold.");
    }
    const { error } = await supabase
      .from("catalog_offers")
      .update({ availability_status: status })
      .eq("id", id);
    if (error) return fail(error.message);
    return { success: true, message: "Status updated successfully", id, availability_status: status };
  }

  return fail(
    'Invalid action. Use action="delete_offer" | "insert_offer" | "update_offer" | "update_status".',
  );
}

/* ------------------------------------------------------------------ */
/* admin-complexes                                                     */
/* ------------------------------------------------------------------ */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateComplex(data: AnyRecord): string | null {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (!str(data.name)) return "name is required";
  const slug = str(data.slug);
  if (!slug || slug.length > 120 || !SLUG_RE.test(slug)) return "slug is invalid";
  if (!str(data.location)) return "location is required";
  return null;
}

export async function adminComplexes(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const { action, id, data, table, orderBy, ascending } = body as {
    action?: string;
    id?: string;
    data?: any;
    table?: string;
    orderBy?: string;
    ascending?: boolean;
  };

  switch (action) {
    case "upload_image": {
      const { imageData, fileName, folder } = (data || {}) as AnyRecord;
      if (!imageData || !fileName) return fail("Missing imageData or fileName");

      const raw = String(imageData);
      const base64Data = raw.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      const filePath = folder ? `${folder}/${fileName}` : String(fileName);
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(filePath, bytes, {
          contentType: raw.split(";")[0]?.split(":")[1] || "image/jpeg",
          upsert: true,
        });
      if (uploadError) return fail(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("project-images").getPublicUrl(filePath);
      return { success: true, url: publicUrl };
    }

    case "insert_complex": {
      if (!data) return fail("Missing data");
      const invalid = validateComplex(data);
      if (invalid) return fail(invalid);

      const { data: insertedData, error } = await supabase
        .from("real_estate_projects")
        .insert({
          name: data.name,
          slug: data.slug,
          location: data.location,
          description: data.description ?? null,
          developer: data.developer ?? null,
          price_range: data.price_range ?? null,
          surface_range: data.surface_range ?? null,
          rooms_range: data.rooms_range ?? null,
          completion_date: data.completion_date ?? null,
          status: data.status ?? "in_progress",
          main_image: data.main_image ?? null,
          videos: data.videos ?? [],
        })
        .select();
      if (error) return fail(error.message);
      return { success: true, data: insertedData };
    }

    case "update_complex": {
      if (!id || !data) return fail("Missing id or data");
      const { data: updatedData, error } = await supabase
        .from("real_estate_projects")
        .update({
          name: data.name,
          location: data.location,
          description: data.description,
          developer: data.developer,
          price_range: data.price_range,
          surface_range: data.surface_range,
          rooms_range: data.rooms_range,
          completion_date: data.completion_date,
          status: data.status,
          main_image: data.main_image,
          videos: data.videos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();
      if (error) return fail(error.message);
      return { success: true, data: updatedData };
    }

    case "delete_complex": {
      if (!id) return fail("Missing id");
      const { error } = await supabase.from("real_estate_projects").delete().eq("id", id);
      if (error) return fail(error.message);
      return { success: true };
    }

    case "select": {
      if (!table) return fail("Missing table");
      let query = supabase.from(table).select("*");
      if (orderBy) query = query.order(orderBy, { ascending: ascending ?? false });
      const { data: selectedData, error } = await query;
      if (error) return fail(error.message);
      return { success: true, data: selectedData };
    }

    case "insert": {
      if (!table || !data) return fail("Missing table or data");
      const { data: insertedData, error } = await supabase.from(table).insert(data).select();
      if (error) return fail(error.message);
      return { success: true, data: insertedData };
    }

    case "upsert": {
      if (!table || !data) return fail("Missing table or data");
      const onConflict = (body?.onConflict as string) || "id";
      const { data: upsertedData, error } = await supabase
        .from(table)
        .upsert(data, { onConflict })
        .select();
      if (error) return fail(error.message);
      return { success: true, data: upsertedData };
    }

    case "update": {
      if (!table || !id || !data) return fail("Missing table, id, or data");
      const { data: updatedData, error } = await supabase
        .from(table)
        .update(data)
        .eq("id", id)
        .select();
      if (error) return fail(error.message);
      return { success: true, data: updatedData };
    }

    case "delete": {
      if (!table || !id) return fail("Missing table or id");
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) return fail(error.message);
      return { success: true };
    }

    default:
      return fail("Invalid action");
  }
}

/* ------------------------------------------------------------------ */
/* api-keys-manager                                                    */
/* ------------------------------------------------------------------ */

export async function apiKeysManager(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const action = (body?.action as string) || "list";

  switch (action) {
    case "list": {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return fail(error.message);
      return { success: true, data };
    }

    case "create": {
      const { key_name, description, expires_at } = body as AnyRecord;
      if (!key_name) return fail("key_name is required");

      const { data: generatedKey, error: keyError } = await supabase.rpc("generate_api_key");
      if (keyError) return fail(keyError.message);

      const { data: newApiKey, error: insertError } = await supabase
        .from("api_keys")
        .insert({
          key_name,
          api_key: generatedKey,
          description,
          expires_at: expires_at || null,
          is_active: true,
        })
        .select()
        .single();
      if (insertError) return fail(insertError.message);
      return { success: true, data: newApiKey };
    }

    case "toggle": {
      const { id, is_active } = body as AnyRecord;
      if (!id) return fail("API key ID is required");
      const { data, error } = await supabase
        .from("api_keys")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return fail(error.message);
      return { success: true, data };
    }

    case "delete": {
      const { id } = body as AnyRecord;
      if (!id) return fail("API key ID is required");
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) return fail(error.message);
      return { success: true, message: "API key deleted successfully" };
    }

    default:
      return fail("Invalid action. Supported actions: list, create, toggle, delete");
  }
}

/* ------------------------------------------------------------------ */
/* update-floor-plan / update-project-image                            */
/* ------------------------------------------------------------------ */

export async function updateFloorPlan(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const propertyId = body?.propertyId as string | undefined;
  if (!propertyId) return fail("propertyId este obligatoriu");

  const { error } = await supabase
    .from("catalog_offers")
    .update({ floor_plan: body?.floor_plan ?? null, updated_at: new Date().toISOString() })
    .eq("id", propertyId);
  if (error) return fail(error.message);
  return { success: true };
}

export async function updateProjectImage(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const projectId = body?.projectId as string | undefined;
  const main_image = body?.main_image as string | undefined;
  if (!projectId || !main_image) return fail("projectId și main_image sunt obligatorii");

  const { error } = await supabase
    .from("real_estate_projects")
    .update({ main_image, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) return fail(error.message);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* fix-property-zones                                                  */
/* ------------------------------------------------------------------ */

function isCoordinates(str: string): boolean {
  if (!str) return false;
  return /^\d{2,}\.\d{3,}/.test(str.trim()) || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(str.trim());
}

const ZONE_LOOKUP: Array<{
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  zone: string;
}> = [
  { latMin: 44.42, latMax: 44.45, lngMin: 25.97, lngMax: 26.0, zone: "Chiajna" },
  { latMin: 44.4, latMax: 44.42, lngMin: 25.99, lngMax: 26.02, zone: "Militari" },
  { latMin: 44.37, latMax: 44.4, lngMin: 26.08, lngMax: 26.11, zone: "Berceni" },
  { latMin: 44.4, latMax: 44.42, lngMin: 26.0, lngMax: 26.03, zone: "Drumul Taberei" },
  { latMin: 44.42, latMax: 44.45, lngMin: 26.05, lngMax: 26.1, zone: "Titan" },
  { latMin: 44.44, latMax: 44.47, lngMin: 26.06, lngMax: 26.1, zone: "Pantelimon" },
  { latMin: 44.43, latMax: 44.46, lngMin: 26.0, lngMax: 26.05, zone: "Centru" },
  { latMin: 44.45, latMax: 44.48, lngMin: 26.05, lngMax: 26.1, zone: "Colentina" },
  { latMin: 44.46, latMax: 44.5, lngMin: 26.05, lngMax: 26.12, zone: "Pipera" },
  { latMin: 44.44, latMax: 44.47, lngMin: 25.98, lngMax: 26.02, zone: "Giulești" },
];

async function getZoneFromCoordinates(lat: number, lng: number): Promise<string> {
  for (const entry of ZONE_LOOKUP) {
    if (lat >= entry.latMin && lat <= entry.latMax && lng >= entry.lngMin && lng <= entry.lngMax) {
      return entry.zone;
    }
  }

  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) return "";

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ro&result_type=sublocality|neighborhood|locality&key=${googleApiKey}`,
    );
    if (!response.ok) return "";
    const data = (await response.json()) as any;
    if (data.status !== "OK" || !data.results?.length) return "";

    for (const result of data.results) {
      for (const component of result.address_components || []) {
        const types = component.types || [];
        if (types.includes("sublocality") || types.includes("neighborhood")) {
          return component.long_name;
        }
      }
    }
    for (const component of data.results[0].address_components || []) {
      if (component.types?.includes("locality")) return component.long_name;
    }
    return "";
  } catch (error) {
    console.error(`Geocoding error for ${lat},${lng}:`, error);
    return "";
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function fixPropertyZones(body: AnyRecord): Promise<Result> {
  const supabase = await db();
  const dryRun = body?.dry_run === true;
  const limit = (body?.limit as number) || 50;

  const { data: properties, error } = await supabase
    .from("catalog_offers")
    .select("id, zone, location, latitude, longitude, project_name")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(limit);
  if (error) return fail(error.message);

  const targets = (properties || []).filter(
    (p: any) =>
      p.latitude && p.longitude && (!p.zone || p.zone.trim() === "" || isCoordinates(p.zone)),
  );

  if (dryRun) {
    return {
      success: true,
      message: `Found ${targets.length} properties with GPS coordinates needing zone names`,
      count: targets.length,
      sample: targets.slice(0, 5).map((p: any) => ({
        id: p.id,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    };
  }

  let fixed = 0;
  let failed = 0;

  for (const prop of targets as any[]) {
    try {
      const zone = await getZoneFromCoordinates(prop.latitude, prop.longitude);
      if (zone) {
        const updateData: AnyRecord = { zone };
        if (prop.location && isCoordinates(prop.location)) updateData.location = zone;

        const { error: updateError } = await supabase
          .from("catalog_offers")
          .update(updateData)
          .eq("id", prop.id);
        if (updateError) failed++;
        else fixed++;
      } else {
        failed++;
      }
      await delay(1100);
    } catch (err) {
      console.error(`Error processing ${prop.id}:`, err);
      failed++;
    }
  }

  return {
    success: true,
    message: `Zone fix completed: ${fixed} fixed, ${failed} failed out of ${targets.length}`,
    fixed,
    failed,
    total: targets.length,
  };
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export const ADMIN_HANDLERS = {
  "admin-offers": adminOffers,
  "admin-complexes": adminComplexes,
  "api-keys-manager": apiKeysManager,
  "update-floor-plan": updateFloorPlan,
  "update-project-image": updateProjectImage,
  "fix-property-zones": fixPropertyZones,
} as const;

export type AdminFunctionName = keyof typeof ADMIN_HANDLERS;

export async function runAdminFunction(
  name: AdminFunctionName,
  body: AnyRecord,
): Promise<Result> {
  const handler = ADMIN_HANDLERS[name];
  if (!handler) return fail(`Unknown admin function: ${name}`);
  try {
    return await handler(body);
  } catch (e) {
    console.error(`[admin:${name}]`, e);
    return fail(e instanceof Error ? e.message : "Unknown error");
  }
}
