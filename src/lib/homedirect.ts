const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type HDAction = "publish" | "update" | "delete";

export interface HDResult {
  success: boolean;
  message: string;
  homedirect_id?: string;
  homedirect_short_id?: string;
  error?: string;
  details?: string;
}

export async function syncToHomedirect(
  listingId: string,
  action: HDAction,
  useDev = false
): Promise<HDResult> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/publish-homedirect`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ listing_id: listingId, action, use_dev: useDev }),
    }
  );
  return res.json();
}
