import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const complexSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  location: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  developer: z.string().nullable().optional(),
  price_range: z.string().nullable().optional(),
  surface_range: z.string().nullable().optional(),
  rooms_range: z.string().nullable().optional(),
  completion_date: z.string().nullable().optional(),
  status: z.string().optional(),
  main_image: z.string().nullable().optional(),
  videos: z.array(z.unknown()).optional(),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check - try JWT first, fall back to checking if request has valid anon key
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;

    if (authHeader?.startsWith("Bearer ")) {
      const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims?.sub) {
          isAuthorized = true;
        }
      } catch (_) {
        // JWT validation failed, check apikey header
      }
    }

    // Allow access if apikey header matches the anon key (admin panel uses local password auth)
    if (!isAuthorized) {
      const apikeyHeader = req.headers.get("apikey");
      if (apikeyHeader === anonKey) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, id, data, table, orderBy, ascending } = await req.json();

    console.log("Admin action:", action, "table:", table, "id:", id);

    switch (action) {
      case "upload_image": {
        const { imageData, fileName, folder } = data || {};
        
        if (!imageData || !fileName) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing imageData or fileName" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Convert base64 to Uint8Array
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const filePath = folder ? `${folder}/${fileName}` : fileName;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(filePath, bytes, {
            contentType: imageData.split(";")[0].split(":")[1] || "image/jpeg",
            upsert: true,
          });
        
        if (uploadError) {
          console.error("Upload error:", uploadError);
          return new Response(
            JSON.stringify({ success: false, error: uploadError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from("project-images")
          .getPublicUrl(filePath);
        
        return new Response(
          JSON.stringify({ success: true, url: publicUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ COMPLEXES (real_estate_projects) ============
      case "update_complex": {
        if (!id || !data) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing id or data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

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

        if (error) {
          console.error("Update error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_complex": {
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("real_estate_projects")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Delete error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "insert_complex": {
        if (!data) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const parsedComplex = complexSchema.safeParse(data);
        if (!parsedComplex.success) {
          return new Response(
            JSON.stringify({ success: false, error: "Date invalide pentru complex" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const complexData = parsedComplex.data;

        const { data: existingSlug } = await supabase
          .from("real_estate_projects")
          .select("id")
          .eq("slug", complexData.slug)
          .limit(1);

        if (existingSlug && existingSlug.length > 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Slug-ul există deja" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: insertedData, error } = await supabase
          .from("real_estate_projects")
          .insert({
            name: complexData.name,
            slug: complexData.slug,
            location: complexData.location,
            description: complexData.description,
            developer: complexData.developer,
            price_range: complexData.price_range,
            surface_range: complexData.surface_range,
            rooms_range: complexData.rooms_range,
            completion_date: complexData.completion_date,
            status: complexData.status || "available",
            main_image: complexData.main_image,
            videos: complexData.videos || [],
          })
          .select();

        if (error) {
          console.error("Insert error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: insertedData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ============ GENERIC CRUD OPERATIONS ============
      case "select": {
        if (!table) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing table" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let query = supabase.from(table).select("*");

        if (orderBy) {
          query = query.order(orderBy, { ascending: ascending ?? false });
        }

        const { data: selectedData, error } = await query;

        if (error) {
          console.error("Select error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: selectedData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "insert": {
        if (!table || !data) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing table or data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: insertedData, error } = await supabase
          .from(table)
          .insert(data)
          .select();

        if (error) {
          console.error("Insert error:", error);
          const status = error.code === '23505' ? 400 : 500;
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: insertedData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!table || !id || !data) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing table, id, or data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updatedData, error } = await supabase
          .from(table)
          .update(data)
          .eq("id", id)
          .select();

        if (error) {
          console.error("Update error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!table || !id) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing table or id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Delete error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
